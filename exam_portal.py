from __future__ import annotations

from flask import Flask, abort, render_template_string, request

from exam_shared import ExamDatabase

app = Flask(__name__)
db = ExamDatabase()
db.initialize()

INDEX_HTML = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tumaini Exam Forms</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; }
    h1 { margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; margin-top: 12px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #0f766e; color: white; }
    a { color: #0f766e; text-decoration: none; }
  </style>
</head>
<body>
  <h1>Tumaini Academy Exam Mark Entry</h1>
  <p>Use the links below to enter marks.</p>
  <table>
    <tr>
      <th>No.</th>
      <th>Exam</th>
      <th>Class</th>
      <th>Subject</th>
      <th>Term</th>
      <th>Year</th>
      <th>Link</th>
    </tr>
    {% for row in forms %}
    <tr>
      <td>{{ loop.index }}</td>
      <td>{{ row.exam_name }}</td>
      <td>{{ row.class_level }}</td>
      <td>{{ row.subject }}</td>
      <td>{{ row.term }}</td>
      <td>{{ row.year }}</td>
      <td><a href="/fill/{{ row.token }}">Open Form</a></td>
    </tr>
    {% endfor %}
  </table>
</body>
</html>
"""

FORM_HTML = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{ form.exam_name }} - {{ form.class_level }}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; }
    h1 { margin-bottom: 6px; }
    .meta { margin-bottom: 14px; color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
    th { background: #0f766e; color: white; }
    input[type=text], input[type=number] { width: 95%; padding: 6px; box-sizing: border-box; }
    button { margin-top: 14px; padding: 10px 18px; background: #0f766e; color: white; border: 0; cursor: pointer; }
    .ok { color: #166534; font-weight: 600; }
    .warn { color: #991b1b; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Tumaini Academy - Mark Entry Form</h1>
  <div class="meta">
    <div><strong>Exam:</strong> {{ form.exam_name }}</div>
    <div><strong>Class:</strong> {{ form.class_level }}</div>
    <div><strong>Subject:</strong> {{ form.subject }}</div>
    <div><strong>Term:</strong> {{ form.term }} | <strong>Year:</strong> {{ form.year }}</div>
    <div><strong>Max Marks:</strong> {{ form.max_marks }}</div>
  </div>

  {% if message %}
    <p class="{{ 'ok' if ok else 'warn' }}">{{ message }}</p>
  {% endif %}

  <form method="post">
    <label><strong>Teacher Name</strong></label>
    <input type="text" name="teacher_name" value="{{ teacher_name }}" placeholder="Enter teacher name">

    <table>
      <tr>
        <th>No.</th>
        <th>Admission No.</th>
        <th>Learner Name</th>
        <th>Marks</th>
      </tr>
      {% for learner in learners %}
      <tr>
        <td>{{ loop.index }}</td>
        <td>{{ learner.admission_no }}</td>
        <td>{{ learner.learner_name }}</td>
        <td>
          <input
            type="number"
            name="mark_{{ learner.admission_no }}"
            step="0.01"
            min="0"
            max="{{ form.max_marks }}"
            value="{{ marks.get(learner.admission_no, '') }}"
          >
        </td>
      </tr>
      {% endfor %}
    </table>
    <button type="submit">Submit Marks</button>
  </form>
</body>
</html>
"""


@app.get("/")
def index() -> str:
    forms = db.list_exam_forms(active_only=True)
    return render_template_string(INDEX_HTML, forms=forms)


@app.route("/fill/<token>", methods=["GET", "POST"])
def fill_form(token: str) -> str:
    form = db.get_exam_form_by_token(token)
    if not form:
        abort(404, "This link is invalid or no longer active.")

    learners = db.get_learners_by_class(form["class_level"])
    existing = {
        row["admission_no"]: "" if row["marks"] is None else str(row["marks"])
        for row in db.get_marks_for_exam(int(form["id"]))
    }

    message = ""
    ok = False
    teacher_name = ""

    if request.method == "POST":
        teacher_name = (request.form.get("teacher_name") or "").strip()
        mark_payload: dict[str, str] = {}
        for learner in learners:
            field = f"mark_{learner['admission_no']}"
            mark_payload[learner["admission_no"]] = request.form.get(field, "")
        saved = db.save_submission(token, teacher_name, mark_payload)
        message = f"Saved/updated {saved} marks."
        ok = True
        existing = {
            row["admission_no"]: "" if row["marks"] is None else str(row["marks"])
            for row in db.get_marks_for_exam(int(form["id"]))
        }

    return render_template_string(
        FORM_HTML,
        form=form,
        learners=learners,
        marks=existing,
        message=message,
        ok=ok,
        teacher_name=teacher_name,
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=False)

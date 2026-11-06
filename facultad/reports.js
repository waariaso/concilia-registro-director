'use strict';

function reportData(records) {
  const detail = records.flatMap(record => record.rows.filter(row => !DirectorModel.error(row)).map(row => ({
    ...row, program: record.program, director: record.director, recordId: record.id,
    ...DirectorModel.calculate(row, record.program)
  })));
  const measures = ['clase','preparation','thesis','administration','research','exact','weekly','exactSemester','semester'];
  function group(key, labels) {
    const groups = new Map();
    for (const row of detail) {
      const id = key(row);
      if (!groups.has(id)) groups.set(id, {
        ...labels(row), teachers: new Set(), programs: new Set(), rows: 0,
        ...Object.fromEntries(measures.map(field => [field, 0]))
      });
      const item = groups.get(id);
      item.teachers.add(DirectorModel.key(row.teacher));
      item.programs.add(row.program);
      item.rows++;
      for (const field of measures) item[field] += row[field];
    }
    return [...groups.values()];
  }
  const programs = group(row => row.program, row => ({program:row.program}));
  const professors = group(row => DirectorModel.key(row.teacher), row => ({teacher:row.teacher}));
  const courses = group(row => JSON.stringify([row.program, DirectorModel.key(row.course)]),
    row => ({program:row.program, course:row.course}));
  return {programs, professors, courses, detail, measures};
}

function reportSheets(report, period) {
  const headers = ['Clase h/semana','Preparación h/semana','Dirección h/semana','Gestión h/semana',
    'Investigación h/semana','Decimal h/semana','Superior h/semana','Decimal h/semestre','Superior h/semestre'];
  const values = row => report.measures.map(field => Number(row[field].toFixed(10)));
  const compare = (a,b) => a.localeCompare(b,'es');
  return [
    {name:'Por programa', rows:[['Periodo','Programa','Profesores','Filas',...headers],
      ...report.programs.slice().sort((a,b)=>compare(a.program,b.program))
        .map(row=>[period,row.program,row.teachers.size,row.rows,...values(row)])]},
    {name:'Por profesor', rows:[['Periodo','Profesor','Programas','Filas',...headers,'Control de 40 horas'],
      ...report.professors.slice().sort((a,b)=>compare(a.teacher,b.teacher))
        .map(row=>[period,row.teacher,[...row.programs].sort(compare).join(' | '),row.rows,...values(row),alert(row)])]},
    {name:'Por curso', rows:[['Periodo','Programa','Curso o actividad','Profesores','Filas',...headers],
      ...report.courses.slice().sort((a,b)=>compare(a.program,b.program)||compare(a.course,b.course))
        .map(row=>[period,row.program,row.course,row.teachers.size,row.rows,...values(row)])]},
    {name:'Detalle', rows:[['Periodo','Programa','Curso o actividad','Profesor','Director','ID registro','ID fila',
      'Créditos','Porcentaje','Trabajos de grado',...headers],
      ...report.detail.slice().sort((a,b)=>compare(a.program,b.program)||compare(a.teacher,b.teacher)||compare(a.course,b.course))
        .map(row=>[period,row.program,row.course,row.teacher,row.director,row.recordId,row.id,row.credits,row.pct,row.works,...values(row)])]}
  ];
}

function renderDashboard(report) {
  const picker = $('dashboard-program');
  const previous = picker.value;
  const ordered = report.programs.slice().sort((a,b)=>b.exact-a.exact || a.program.localeCompare(b.program,'es'));
  picker.innerHTML = ordered.map(row=>`<option>${escapeHtml(row.program)}</option>`).join('');
  if (ordered.some(row=>row.program===previous)) picker.value = previous;
  picker.disabled = !ordered.length;
  $('excel').disabled = !report.detail.length;
  function bars(rows, label) {
    if (!rows.length) return '<p>Sin horas válidas en el periodo seleccionado.</p>';
    const max = Math.max(1,...rows.map(row=>row.exact));
    return rows.map(row=>`<div class="report-bar"><div><span>${escapeHtml(label(row))}</span><strong>${fmt(row.exact)} h/sem</strong></div>
      <span class="report-track" aria-hidden="true"><span style="width:${row.exact/max*100}%"></span></span></div>`).join('');
  }
  $('program-chart').innerHTML = bars(ordered,row=>row.program);
  function courses() {
    const rows = report.courses.filter(row=>row.program===picker.value)
      .sort((a,b)=>b.exact-a.exact || a.course.localeCompare(b.course,'es'));
    $('course-chart').innerHTML = bars(rows.slice(0,12),row=>row.course);
    if (rows.length > 12) $('course-chart').innerHTML += '<p>Las barras muestran las 12 asignaturas con mayor carga. El detalle completo aparece en la tabla.</p>';
    $('dashboard-courses').innerHTML = rows.map(row=>`<tr><td>${escapeHtml(row.course)}</td><td>${row.teachers.size}</td>
      ${['clase','preparation','thesis','administration','research','exact','weekly'].map(field=>`<td>${fmt(row[field])}</td>`).join('')}</tr>`).join('')
      || empty(9,'Carga registros o agrega filas para ver las asignaturas.');
  }
  picker.onchange = courses;
  courses();
}

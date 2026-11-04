(function(root){
 const rules={
  "Doctorado en Salud Pública": {
    "hours": 48,
    "level": "Doctorado"
  },
  "Maestría en Salud Pública": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Maestría en Epidemiología": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Maestría en Administración en Salud": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Especialización en Gerencia de la Calidad en Salud": {
    "hours": 16,
    "level": "Especialización"
  },
  "Especialización en Salud Familiar y Comunitaria": {
    "hours": 16,
    "level": "Especialización"
  },
  "Maestría en Fisiología Traslacional": {
    "hours": 32,
    "level": "Maestría de investigación"
  },
  "Maestría en Farmacología": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Maestría en Informática Biomédica": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Maestría en Seguridad y Salud en el Trabajo": {
    "hours": 16,
    "level": "Maestría de profundización"
  },
  "Especialización en Higiene Industrial": {
    "hours": 16,
    "level": "Especialización"
  },
  "Especialización en Ergonomía": {
    "hours": 16,
    "level": "Especialización"
  },
  "Especialización en Seguridad y Salud en el Trabajo": {
    "hours": 16,
    "level": "Especialización"
  },
  "Especialización en Gastroenterología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cardiología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Reumatología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Infectología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Crítica y Cuidado Intensivo Pediátrico": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Nefrología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Neumología Pediátrica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Neonatología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Pediatría": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Psiquiatría": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Psiquiatría de Enlace e Interconsultas": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Psiquiatría Infantil y del Adolescente": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Interna - FSFB": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Interna - Santa Clara": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cardiología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Oncología Clínica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Crítica y Cuidado Intensivo - Primera Especialidad": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Crítica y Cuidado Intensivo - Segunda Especialidad": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Neumología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina del Deporte y Actividad Física": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina del Dolor y Cuidados Paliativos": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina de Urgencias": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Familiar": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Radiología e Imágenes Diagnósticas": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Neurología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Física y Rehabilitación": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Anestesia Cardiovascular y Torácica": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Anestesiología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cirugía de Mano": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cirugía de Tórax": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cirugía General": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cirugía Plástica, Reconstructiva y Estética": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Dermatología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Ginecología y Obstetricia": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Urología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Neurocirugía": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Oftalmología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Cirugía Vascular y Angiología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Medicina Materno Fetal": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  },
  "Especialización en Ortopedia y Traumatología": {
    "hours": 32,
    "level": "Especialización médico-quirúrgica o clínica"
  }
};
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
 const lookup=new Map(Object.entries(rules).map(([name,r])=>[normalize(name),Object.freeze({...r,name})]));
 function forProgram(program){return lookup.get(normalize(program))||null}
 const api={forProgram};if(typeof module!=='undefined')module.exports=api;else root.ThesisRules=api;
})(globalThis);

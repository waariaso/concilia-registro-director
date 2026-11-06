'use strict';

// XLSX uses XML parts in an uncompressed ZIP so exports work entirely in the browser.
function facultyWorkbook(sheets) {
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const rels = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')
    .replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
  function column(index) {
    let label = '';
    for (let n=index+1; n; n=Math.floor((n-1)/26)) label=String.fromCharCode(65+(n-1)%26)+label;
    return label;
  }
  function sheetXml(rows) {
    const headers = rows[0];
    const cols = headers.map((label,i)=>{
      const widest = rows.reduce((n,row)=>Math.max(n,String(row[i] ?? '').length),label.length);
      return `<col min="${i+1}" max="${i+1}" width="${Math.min(55,Math.max(12,widest+2))}" customWidth="1"/>`;
    }).join('');
    const data = rows.map((row,i)=>`<row r="${i+1}">${row.map((value,j)=>{
      const ref = column(j)+(i+1);
      return typeof value==='number' && Number.isFinite(value)
        ? `<c r="${ref}"><v>${value}</v></c>`
        : `<c r="${ref}" t="inlineStr"${i===0?' s="1"':''}><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join('')}</row>`).join('');
    return `<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${data}</sheetData><autoFilter ref="A1:${column(headers.length-1)}${rows.length}"/></worksheet>`;
  }
  const content = 'application/vnd.openxmlformats-officedocument.spreadsheetml.';
  const parts = {
    '[Content_Types].xml': `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="${content}sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="${content}styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="${content}worksheet+xml"/>`).join('')}</Types>`,
    '_rels/.rels': `<Relationships xmlns="${rels}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<workbook xmlns="${ns}" xmlns:r="${office}"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<Relationships xmlns="${rels}">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${office}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rIdStyles" Type="${office}/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `<styleSheet xmlns="${ns}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF245C45"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`
  };
  sheets.forEach((sheet,i)=>{parts[`xl/worksheets/sheet${i+1}.xml`]=sheetXml(sheet.rows);});

  const encoder = new TextEncoder();
  const files = [], directory = [];
  let offset = 0, directorySize = 0;
  for (const [path,source] of Object.entries(parts)) {
    const name = encoder.encode(path), data = encoder.encode('<?xml version="1.0" encoding="UTF-8"?>'+source);
    let crc = -1;
    for (const byte of data) {
      crc ^= byte;
      for (let bit=0; bit<8; bit++) crc = (crc>>>1) ^ (crc&1 ? 0xedb88320 : 0);
    }
    crc = ~crc;
    const local = new DataView(new ArrayBuffer(30));
    const entry = new DataView(new ArrayBuffer(46));
    local.setUint32(0,0x04034b50,true); local.setUint16(4,20,true);
    local.setUint32(14,crc,true); local.setUint32(18,data.length,true);
    local.setUint32(22,data.length,true); local.setUint16(26,name.length,true);
    entry.setUint32(0,0x02014b50,true); entry.setUint16(4,20,true); entry.setUint16(6,20,true);
    entry.setUint32(16,crc,true); entry.setUint32(20,data.length,true);
    entry.setUint32(24,data.length,true); entry.setUint16(28,name.length,true); entry.setUint32(42,offset,true);
    files.push(local.buffer,name,data);
    directory.push(entry.buffer,name);
    offset += 30+name.length+data.length;
    directorySize += 46+name.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  const count = Object.keys(parts).length;
  end.setUint32(0,0x06054b50,true); end.setUint16(8,count,true); end.setUint16(10,count,true);
  end.setUint32(12,directorySize,true); end.setUint32(16,offset,true);
  return new Blob([...files,...directory,end.buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

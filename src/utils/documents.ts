import { DeptProgramRecord, DocumentKind, VolunteerRecord } from '../types';
import { SignatureImg } from '../store/settingsStore';
import { triggerDownload } from './download';

type DocumentRecord = DeptProgramRecord | VolunteerRecord;

const encoder = new TextEncoder();

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function zipStore(files: { name: string; content: string }[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);

    localParts.push(local);
    centralParts.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  }

  const localBytes = concat(localParts);
  const centralBytes = concat(centralParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralBytes.length),
    u32(localBytes.length),
    u16(0),
  ]);

  return new Blob([concat([localBytes, centralBytes, end])], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(label: string, value?: unknown): string {
  return `<w:p><w:r><w:t>${xmlEscape(label)}: ${xmlEscape(value || '-')}</w:t></w:r></w:p>`;
}

function title(text: string): string {
  return `<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function documentLabel(kind: DocumentKind): string {
  return kind === 'application' ? '신청서' : '결과보고서';
}

function recordRows(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): string[] {
  const rows = [
    paragraph('문서', documentLabel(kind)),
    paragraph('프로그램 유형', record.programType),
    paragraph('프로그램명', record.title),
    paragraph('학생', `${record.name} (${record.studentId})`),
    paragraph('학년', record.grade),
    paragraph('연도/학기', `${record.year} / ${record.semester}`),
    paragraph('담당교수', record.professor),
    paragraph('인정시간', record.recognizedHours),
    paragraph('진행상태', record.status),
    paragraph('최종 승인일', 'finalApprovalDate' in record ? record.finalApprovalDate : '-'),
    paragraph('행정실 코멘트', record.adminComment),
    paragraph('신청서 전송 상태', record.documentStatus?.application),
    paragraph('결과보고서 전송 상태', record.documentStatus?.result),
  ];

  if ('teamMembers' in record) {
    rows.push(
      paragraph('팀 구성원', record.teamMembers.map((m) => `${m.name}(${m.studentId})`).join(', ')),
      paragraph('계획서', record.plan),
      paragraph('보고서 파일', record.reportFile?.name),
      paragraph('포스터 확인', record.posterSubmitted ? '제출' : '미제출'),
    );
  } else {
    rows.push(paragraph('누적 봉사시간', record.accumulatedHours), paragraph('봉사 인증서', record.certFile?.name));
  }

  rows.push(
    paragraph('서명 등록 교수', signature?.professorName),
    paragraph('서명 파일', signature?.fileName),
    paragraph('서명 등록일', signature?.uploadedAt ? new Date(signature.uploadedAt).toLocaleString('ko-KR') : ''),
  );

  return rows;
}

export function createRecordDocxBlob(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): Blob {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${title(`${record.programType} ${documentLabel(kind)}`)}
    ${recordRows(record, kind, signature).join('\n    ')}
    <w:p><w:r><w:t>※ 본 문서는 프론트엔드 목업에서 자동 생성되었습니다.</w:t></w:r></w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return zipStore([
    { name: '[Content_Types].xml', content: CONTENT_TYPES },
    { name: '_rels/.rels', content: RELS },
    { name: 'word/document.xml', content: documentXml },
  ]);
}

export function downloadRecordDocx(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): void {
  const safe = `${record.studentId}-${record.name}-${documentLabel(kind)}`.replace(/[\\/:*?"<>|]/g, '_');
  triggerDownload(createRecordDocxBlob(record, kind, signature), `${safe}.docx`);
}

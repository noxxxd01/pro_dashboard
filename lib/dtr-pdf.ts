import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface DayRecord {
  day: number;
  amArrival: string;
  amDeparture: string;
  pmArrival: string;
  pmDeparture: string;
  undertimeHours: string;
  undertimeMinutes: string;
  label?: string;
  isDayOff: boolean;
}

interface DtrData {
  studentName: string;
  monthLabel: string;
  days: DayRecord[];
  supervisorName: string;
}

const PH_HOLIDAYS: Record<string, string> = {
  '01-01': "New Year's Day",
  '04-09': 'Araw ng Kagitingan',
  '05-01': 'Labor Day',
  '06-12': 'Independence Day',
  '08-21': 'Ninoy Aquino Day',
  '08-30': 'National Heroes Day',
  '11-30': 'Bonifacio Day',
  '12-25': 'Christmas Day',
  '12-30': 'Rizal Day',
};

export function buildDayRecords(
  year: number,
  month: number,
  logsByDay: Map<
    number,
    {
      timeIn: Date | null;
      breakIn: Date | null;
      breakOut: Date | null;
      timeOut: Date | null;
    }
  >,
): DayRecord[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: DayRecord[] = [];

  const formatTime = (d: Date | null) =>
    d
      ? d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '';

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dow = date.getDay();
    const key = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holiday = PH_HOLIDAYS[key];
    const log = logsByDay.get(day);

    records.push({
      day,
      amArrival: log ? formatTime(log.timeIn) : '',
      amDeparture: log ? formatTime(log.breakIn) : '',
      pmArrival: log ? formatTime(log.breakOut) : '',
      pmDeparture: log ? formatTime(log.timeOut) : '',
      undertimeHours: '',
      undertimeMinutes: '',
      label:
        holiday ?? (dow === 6 ? 'Saturday' : dow === 0 ? 'Sunday' : undefined),
      isDayOff: dow === 0 || dow === 6 || Boolean(holiday),
    });
  }

  return records;
}

// Column proportions — Day gets less space, the four time columns share most of it evenly,
// Undertime hours/minutes get a small slice. These always sum to 1 so the table stretches
// to fill the full panel width regardless of page size.
const COL_WEIGHTS = [0.09, 0.17, 0.17, 0.17, 0.17, 0.115, 0.115];
const COL_LABELS = [
  'Day',
  'Arrival',
  'Departure',
  'Arrival',
  'Departure',
  'Hours',
  'Minutes',
];

export async function generateDtrPdf(data: DtrData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { width, height } = page.getSize();
  const margin = 24;
  const gutter = 14;
  const panelWidth = (width - margin * 2 - gutter) / 2;

  function drawPanel(offsetX: number) {
    let y = height - 30;
    const centerX = offsetX + panelWidth / 2;

    const drawCentered = (text: string, size: number, useFont = font) => {
      const textWidth = useFont.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: centerX - textWidth / 2,
        y,
        size,
        font: useFont,
      });
      y -= size + 6;
    };

    drawCentered('DAILY TIME RECORD', 13, boldFont);
    drawCentered('-----o0o-----', 9);
    y -= 6;
    drawCentered(data.studentName, 11, boldFont);
    drawCentered('(Name)', 8, italicFont);
    y -= 4;

    page.drawText('For the month of', { x: offsetX, y, size: 8, font });
    page.drawText(data.monthLabel, {
      x: offsetX + 170,
      y,
      size: 9,
      font: boldFont,
    });
    y -= 14;

    page.drawText('Official hours for arrival and', {
      x: offsetX,
      y,
      size: 8,
      font,
    });
    page.drawText('departure', { x: offsetX, y: y - 10, size: 8, font });
    page.drawText('Regular', { x: offsetX + 145, y, size: 8, font });
    page.drawText('days', { x: offsetX + 145, y: y - 10, size: 8, font });
    page.drawText('Saturdays', { x: offsetX + 145, y: y - 20, size: 8, font });
    y -= 36;

    // ---- Table geometry ----
    const colWidths = COL_WEIGHTS.map((w) => panelWidth * w);
    const colStartX: number[] = [];
    let colX = offsetX;
    for (const w of colWidths) {
      colStartX.push(colX);
      colX += w;
    }
    const tableWidth = colX - offsetX;
    const rowHeight = 14;
    const groupRowHeight = 13;
    const subRowHeight = 13;
    const headerHeight = groupRowHeight + subRowHeight;

    const tableTop = y;
    const subRowTopY = tableTop - groupRowHeight;
    const headerBottomY = tableTop - headerHeight;

    // "Day" — merged cell, vertically centered across both header rows
    const dayLabelW = boldFont.widthOfTextAtSize('Day', 8);
    page.drawText('Day', {
      x: colStartX[0] + colWidths[0] / 2 - dayLabelW / 2,
      y: tableTop - headerHeight / 2 - 3,
      size: 8,
      font: boldFont,
    });

    // Group headers: A.M. / P.M. / Undertime
    const groupSpans: Array<[string, number, number]> = [
      ['A.M.', 1, 2],
      ['P.M.', 3, 4],
      ['Undertime', 5, 6],
    ];
    for (const [label, startCol, endCol] of groupSpans) {
      const spanStartX = colStartX[startCol];
      const spanEndX = colStartX[endCol] + colWidths[endCol];
      const spanCenterX = (spanStartX + spanEndX) / 2;
      const labelW = boldFont.widthOfTextAtSize(label, 8);
      page.drawText(label, {
        x: spanCenterX - labelW / 2,
        y: tableTop - 9,
        size: 8,
        font: boldFont,
      });
    }

    // Sub-headers: Arrival / Departure / Arrival / Departure / Hours / Minutes
    const subLabels = [
      'Arrival',
      'Departure',
      'Arrival',
      'Departure',
      'Hours',
      'Minutes',
    ];
    subLabels.forEach((label, i) => {
      const col = i + 1;
      const labelW = boldFont.widthOfTextAtSize(label, 7);
      page.drawText(label, {
        x: colStartX[col] + colWidths[col] / 2 - labelW / 2,
        y: subRowTopY - 9,
        size: 7,
        font: boldFont,
      });
    });

    // Divider between group row and sub-header row — stops at the Day column boundary
    page.drawLine({
      start: { x: colStartX[1], y: subRowTopY },
      end: { x: offsetX + tableWidth, y: subRowTopY },
      thickness: 0.75,
    });

    // ---- Data rows ----
    // rowTops[i] = y-coordinate of the TOP of row i; the row spans from rowTops[i] down to rowTops[i]-rowHeight
    const rowTops: number[] = [];
    let cursorY = headerBottomY;
    for (let i = 0; i < data.days.length; i++) {
      rowTops.push(cursorY);
      cursorY -= rowHeight;
    }
    const tableBottomY = cursorY;

    data.days.forEach((rec, i) => {
      const rowTopY = rowTops[i];
      const rowBottomY = rowTopY - rowHeight;
      const textBaselineY = rowTopY - rowHeight / 2 - 3; // vertically centered within the row

      if (rec.isDayOff) {
        page.drawRectangle({
          x: colStartX[1],
          y: rowBottomY,
          width: tableWidth - colWidths[0],
          height: rowHeight,
          color: rgb(0.85, 0.85, 0.85),
        });
        const label = rec.label ?? '';
        const labelWidth = italicFont.widthOfTextAtSize(label, 7.5);
        page.drawText(label, {
          x: colStartX[1] + (tableWidth - colWidths[0]) / 2 - labelWidth / 2,
          y: textBaselineY,
          size: 7.5,
          font: italicFont,
        });
      } else {
        page.drawText(rec.amArrival, {
          x: colStartX[1] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
        page.drawText(rec.amDeparture, {
          x: colStartX[2] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
        page.drawText(rec.pmArrival, {
          x: colStartX[3] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
        page.drawText(rec.pmDeparture, {
          x: colStartX[4] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
        page.drawText(rec.undertimeHours, {
          x: colStartX[5] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
        page.drawText(rec.undertimeMinutes, {
          x: colStartX[6] + 3,
          y: textBaselineY,
          size: 7.5,
          font,
        });
      }

      // Day number — always shown, vertically centered in its own column
      page.drawText(String(rec.day), {
        x: offsetX + 5,
        y: textBaselineY,
        size: 7.5,
        font,
      });

      // Horizontal line under this row
      page.drawLine({
        start: { x: offsetX, y: rowBottomY },
        end: { x: offsetX + tableWidth, y: rowBottomY },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });
    });

    // ---- Borders drawn ONCE for the whole table (header + all rows) ----

    // Outer rectangle, single pass, covering header + data rows together
    page.drawRectangle({
      x: offsetX,
      y: tableBottomY,
      width: tableWidth,
      height: tableTop - tableBottomY,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.75,
    });

    // Explicit boundary between the header block and the first data row (Day 1) —
    // without this, Day 1's row has no top edge and looks unenclosed
    page.drawLine({
      start: { x: offsetX, y: headerBottomY },
      end: { x: offsetX + tableWidth, y: headerBottomY },
      thickness: 0.75,
    });

    // Day column divider — always full table height (header + every row)
    page.drawLine({
      start: { x: colStartX[1], y: tableBottomY },
      end: { x: colStartX[1], y: tableTop },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Interior column dividers (cols 2-6)
    for (let col = 2; col <= 6; col++) {
      const x = colStartX[col];

      // Columns 3 and 5 sit at the boundary BETWEEN group cells (A.M./P.M., P.M./Undertime),
      // so they run the full header height. Columns 2, 4, 6 sit INSIDE a group
      // (Arrival|Departure, Arrival|Departure, Hours|Minutes), so they must stop below
      // the group-label row and only appear alongside the sub-header labels.
      const isGroupBoundary = col === 3 || col === 5;
      const headerLineTopY = isGroupBoundary ? tableTop : subRowTopY;

      page.drawLine({
        start: { x, y: headerBottomY },
        end: { x, y: headerLineTopY },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });

      // Through data rows, skipping day-off rows entirely
      let segmentStart: number | null = null;
      for (let i = 0; i <= data.days.length; i++) {
        const isOff = i < data.days.length && data.days[i].isDayOff;
        if (!isOff && segmentStart === null) {
          segmentStart = rowTops[i];
        }
        if ((isOff || i === data.days.length) && segmentStart !== null) {
          const segmentEnd = i < data.days.length ? rowTops[i] : tableBottomY;
          page.drawLine({
            start: { x, y: segmentStart },
            end: { x, y: segmentEnd },
            thickness: 0.5,
            color: rgb(0.6, 0.6, 0.6),
          });
          segmentStart = null;
        }
      }
    }

    y = tableBottomY;

    // ---- Total row: Day through P.M. Departure merge into ONE cell (just "Total" text),
    // only Hours and Minutes columns remain as separate bordered cells ----
    const totalRowHeight = 15;
    const totalRowBottomY = y - totalRowHeight;

    // Outer rectangle around the whole Total row
    page.drawRectangle({
      x: offsetX,
      y: totalRowBottomY,
      width: tableWidth,
      height: totalRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.75,
    });

    // Only draw dividers at colStartX[5] (start of "Hours") and colStartX[6] (start of "Minutes") —
    // everything from Day through P.M. Departure (columns 0-4) stays merged/unbroken
    [colStartX[5], colStartX[6]].forEach((x) => {
      page.drawLine({
        start: { x, y: totalRowBottomY },
        end: { x, y },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      });
    });

    const totalTextY = y - totalRowHeight / 2 - 3;
    page.drawText('Total', {
      x: offsetX + 4,
      y: totalTextY,
      size: 8,
      font: boldFont,
    });
    const totalW = font.widthOfTextAtSize('0', 8);
    page.drawText('0', {
      x: colStartX[5] + colWidths[5] / 2 - totalW / 2,
      y: totalTextY,
      size: 8,
      font,
    });
    page.drawText('0', {
      x: colStartX[6] + colWidths[6] / 2 - totalW / 2,
      y: totalTextY,
      size: 8,
      font,
    });

    y = totalRowBottomY - 15;

    // ---- Certification ----
    const certText =
      'I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.';
    const words = certText.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (italicFont.widthOfTextAtSize(testLine, 8) > tableWidth - 10 && line) {
        const lw = italicFont.widthOfTextAtSize(line, 8);
        page.drawText(line, {
          x: offsetX + tableWidth / 2 - lw / 2,
          y,
          size: 8,
          font: italicFont,
        });
        y -= 11;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      const lw = italicFont.widthOfTextAtSize(line, 8);
      page.drawText(line, {
        x: offsetX + tableWidth / 2 - lw / 2,
        y,
        size: 8,
        font: italicFont,
      });
      y -= 11;
    }
    y -= 22;

    // ---- Student signature ----
    page.drawLine({
      start: { x: offsetX, y: y + 8 },
      end: { x: offsetX + tableWidth, y: y + 8 },
      thickness: 0.5,
    });
    const studentSig = data.studentName.toUpperCase();
    const studentSigW = boldFont.widthOfTextAtSize(studentSig, 9);
    page.drawText(studentSig, {
      x: offsetX + tableWidth / 2 - studentSigW / 2,
      y,
      size: 9,
      font: boldFont,
    });
    y -= 22;

    page.drawText('VERIFIED as to the prescribed office hours:', {
      x: offsetX,
      y,
      size: 8,
      font: italicFont,
    });
    y -= 34;

    // ---- Supervisor signature ----
    page.drawLine({
      start: { x: offsetX, y: y + 8 },
      end: { x: offsetX + tableWidth, y: y + 8 },
      thickness: 0.5,
    });
    const supName = data.supervisorName.toUpperCase();
    const supWidth = boldFont.widthOfTextAtSize(supName, 9);
    page.drawText(supName, {
      x: offsetX + tableWidth / 2 - supWidth / 2,
      y,
      size: 9,
      font: boldFont,
    });
    y -= 11;
    const sigLabel = 'Signature of Immediate Supervisor';
    const sigWidth = italicFont.widthOfTextAtSize(sigLabel, 8);
    page.drawText(sigLabel, {
      x: offsetX + tableWidth / 2 - sigWidth / 2,
      y,
      size: 8,
      font: italicFont,
    });
  }

  drawPanel(margin);
  drawPanel(margin + panelWidth + gutter);

  page.drawLine({
    start: { x: width / 2, y: height - 10 },
    end: { x: width / 2, y: 10 },
    thickness: 0.5,
    dashArray: [3, 3],
    color: rgb(0.5, 0.5, 0.8),
  });

  return pdfDoc.save();
}

const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

async function generatePdf(data, outPath) {
  // data: {systolic, diastolic, pulse, rawText}
  const doc = new PDFDocument({ autoFirstPage: true });
  await fs.ensureDir(require('path').dirname(outPath));
  const stream = fs.createWriteStream(outPath);
  doc.pipe(stream);

  doc.fontSize(20).text('Tomapresion - Result', { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(16).text(`Systolic: ${data.systolic ?? 'N/A'}`);
  doc.fontSize(16).text(`Diastolic: ${data.diastolic ?? 'N/A'}`);
  doc.fontSize(16).text(`Pulse: ${data.pulse ?? 'N/A'}`);

  doc.moveDown();
  doc.fontSize(12).text('Raw OCR Text (truncated):');
  doc.fontSize(10).text((data.rawText || '').slice(0, 800));

  // simple chart: create an image and embed
  const width = 600;
  const height = 300;
  const chartCallback = (ChartJS) => {
    // no-op
  };
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback });
  const chartData = {
    labels: ['Systolic', 'Diastolic', 'Pulse'],
    datasets: [{ label: 'Values', data: [data.systolic || 0, data.diastolic || 0, data.pulse || 0], backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56'] }]
  };
  const config = { type: 'bar', data: chartData };
  return chartJSNodeCanvas.renderToBuffer(config).then((image) => {
    doc.addPage();
    doc.image(image, { fit: [500, 300], align: 'center' });
    doc.end();
    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  });
}

module.exports = { generatePdf };

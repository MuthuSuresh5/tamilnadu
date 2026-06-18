const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Complaint = require('../models/Complaint');
const Ward = require('../models/Ward');

const buildFilter = (query, officerWard) => {
  const { ward, status, startDate, endDate } = query;
  const filter = {};
  if (officerWard) filter.wardNumber = officerWard;
  if (ward) filter.wardNumber = parseInt(ward);
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

exports.generatePDF = async (req, res) => {
  try {
    const officerWard = req.user.role === 'officer' ? req.user.wardNumber : null;
    const complaints = await Complaint.find(buildFilter(req.query, officerWard))
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('assignedOfficer', 'name');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).fillColor('#D32F2F').text('Tamil Nadu Smart Complaint System', { align: 'center' });
    doc.fontSize(12).fillColor('#333').text('Complaint Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown();

    const headers = ['Complaint ID', 'Name', 'Ward', 'Category', 'Status', 'Priority', 'Date'];
    const colWidths = [90, 90, 40, 80, 70, 60, 80];
    let x = 50, y = doc.y;

    doc.fillColor('#D32F2F');
    headers.forEach((h, i) => { doc.fontSize(9).text(h, x, y, { width: colWidths[i] }); x += colWidths[i]; });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#D32F2F');
    doc.moveDown(0.3);

    complaints.forEach((c, idx) => {
      if (doc.y > 700) doc.addPage();
      x = 50; y = doc.y;
      doc.fillColor(idx % 2 === 0 ? '#f9f9f9' : '#fff').rect(50, y - 2, 500, 18).fill();
      doc.fillColor('#333');
      const row = [c.complaintId, c.citizenName, c.wardNumber, c.category, c.status, c.priority, new Date(c.createdAt).toLocaleDateString('en-IN')];
      row.forEach((val, i) => { doc.fontSize(8).text(String(val || ''), x, y, { width: colWidths[i] }); x += colWidths[i]; });
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.generateExcel = async (req, res) => {
  try {
    const officerWard = req.user.role === 'officer' ? req.user.wardNumber : null;
    const complaints = await Complaint.find(buildFilter(req.query, officerWard))
      .sort({ createdAt: -1 })
      .limit(5000)
      .populate('assignedOfficer', 'name');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TNCMS';

    const sheet = workbook.addWorksheet('Complaints');
    sheet.columns = [
      { header: 'Complaint ID', key: 'complaintId', width: 16 },
      { header: 'Citizen ID', key: 'citizenId', width: 12 },
      { header: 'Name', key: 'citizenName', width: 20 },
      { header: 'Phone', key: 'phone', width: 14 },
      { header: 'Ward', key: 'wardNumber', width: 8 },
      { header: 'Category', key: 'category', width: 14 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Priority', key: 'priority', width: 10 },
      { header: 'Officer', key: 'officer', width: 18 },
      { header: 'Submitted', key: 'submittedDate', width: 14 },
      { header: 'Completed', key: 'completedDate', width: 14 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };

    complaints.forEach(c => {
      sheet.addRow({
        complaintId: c.complaintId, citizenId: c.citizenId, citizenName: c.citizenName,
        phone: c.phone, wardNumber: c.wardNumber, category: c.category, title: c.title,
        status: c.status, priority: c.priority, officer: c.assignedOfficer?.name || '',
        submittedDate: c.submittedDate ? new Date(c.submittedDate).toLocaleDateString('en-IN') : '',
        completedDate: c.completedDate ? new Date(c.completedDate).toLocaleDateString('en-IN') : '',
      });
    });

    // Ward summary sheet
    const wards = await Ward.find().sort({ wardNumber: 1 });
    const wardSheet = workbook.addWorksheet('Ward Summary');
    wardSheet.columns = [
      { header: 'Ward No', key: 'wardNumber', width: 10 },
      { header: 'Ward Name', key: 'wardName', width: 20 },
      { header: 'Officer', key: 'officerName', width: 20 },
      { header: 'Total', key: 'totalComplaints', width: 10 },
      { header: 'Resolved', key: 'resolvedComplaints', width: 10 },
      { header: 'Pending', key: 'pendingComplaints', width: 10 },
    ];
    wardSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wardSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD32F2F' } };
    wards.forEach(w => wardSheet.addRow({ wardNumber: w.wardNumber, wardName: w.wardName, officerName: w.officerName, totalComplaints: w.totalComplaints, resolvedComplaints: w.resolvedComplaints, pendingComplaints: w.pendingComplaints }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=complaints-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

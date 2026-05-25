import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { OrderState } from '../types';

export const generateInvoicePDF = (order: OrderState) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(91, 137, 177); // #5B89B1
  doc.text('SERVICE INVOICE', pageWidth / 2, 20, { align: 'center' });

  // Shop Info
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${order.shopName || 'ABC Auto'}`, 14, 35);
  doc.text(`Phone: ${order.phoneNumber || '818-555-1212'}`, 14, 40);
  doc.text(`Mechanic: ${order.mechanicName || 'Arman'}`, 14, 45);

  // Vehicle Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('VEHICLE INFORMATION', 14, 60);
  doc.setFontSize(10);
  doc.text(`Year/Make/Model: ${order.vehicle.year || '-'} ${order.vehicle.make || '-'} ${order.vehicle.model || '-'}`, 14, 68);
  doc.text(`Trim: ${order.vehicle.trim || 'N/A'}`, 14, 73);
  doc.text(`VIN: ${order.vehicle.vin || 'N/A'}`, 14, 78);
  doc.text(`Plate: ${order.vehicle.licensePlate || 'N/A'}`, 14, 83);

  // Parts & Fluids Table
  const tableData = [
    ...order.parts.map(p => [p.name, 'Part', p.quantity, '-']),
    ...order.fluids.map(f => [f.subcategory.replace('_', ' '), 'Fluid', '1', f.spec])
  ];

  (doc as any).autoTable({
    startY: 95,
    head: [['Description', 'Type', 'Qty', 'Spec/Notes']],
    body: tableData,
    headStyles: { fillColor: [91, 137, 177] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.text('Thank you for your business!', pageWidth / 2, finalY, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, finalY + 7, { align: 'center' });

  // Save
  const fileName = `Invoice_${order.vehicle.make || 'Order'}_${Date.now()}.pdf`;
  doc.save(fileName);
};

export const generateInvoiceText = (order: OrderState) => {
  let text = `SERVICE INVOICE\n`;
  text += `================\n\n`;
  text += `Shop: ${order.shopName || 'ABC Auto'}\n`;
  text += `Mechanic: ${order.mechanicName || 'Arman'}\n\n`;
  text += `VEHICLE:\n`;
  text += `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}\n`;
  if (order.vehicle.vin) text += `VIN: ${order.vehicle.vin}\n`;
  if (order.vehicle.licensePlate) text += `Plate: ${order.vehicle.licensePlate}\n`;
  text += `\nITEMS:\n`;
  order.parts.forEach(p => {
    text += `- ${p.name} (x${p.quantity})\n`;
  });
  order.fluids.forEach(f => {
    text += `- ${f.subcategory.replace('_', ' ')}: ${f.spec}\n`;
  });
  text += `\nGenerated on: ${new Date().toLocaleString()}`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${order.vehicle.make || 'Order'}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

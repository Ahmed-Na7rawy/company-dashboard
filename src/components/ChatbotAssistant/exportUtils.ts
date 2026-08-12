import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import type { ChatMessage, ChartConfig } from './index';

export async function exportChatToPDF(messages: ChatMessage[], language: 'en' | 'ar', darkMode: boolean) {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.maxWidth = '800px';
  container.style.background = darkMode ? '#0f172a' : '#ffffff';
  container.style.color = darkMode ? '#f1f5f9' : '#1e293b';

  const title = document.createElement('h1');
  title.textContent = language === 'en' ? 'Apex Dashboard Assistant - Chat Export' : 'مساعد أبيكس - تصدير المحادثة';
  title.style.marginBottom = '20px';
  title.style.color = '#128d46';
  title.style.borderBottom = '2px solid #128d46';
  title.style.paddingBottom = '10px';
  container.appendChild(title);

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const dateStr = document.createElement('p');
  dateStr.textContent = language === 'en' 
    ? `Exported: ${new Date().toLocaleString(locale)}`
    : `تم التصدير: ${new Date().toLocaleString(locale)}`;
  dateStr.style.color = darkMode ? '#94a3b8' : '#64748b';
  dateStr.style.fontSize = '14px';
  dateStr.style.marginBottom = '20px';
  container.appendChild(dateStr);

  for (const msg of messages) {
    const msgDiv = document.createElement('div');
    msgDiv.style.marginBottom = '20px';
    msgDiv.style.padding = '12px 16px';
    msgDiv.style.borderRadius = '12px';
    msgDiv.style.maxWidth = '85%';

    if (msg.role === 'user') {
      msgDiv.style.background = '#128d46';
      msgDiv.style.color = '#ffffff';
      msgDiv.style.marginLeft = 'auto';
      msgDiv.style.borderBottomRightRadius = '4px';
    } else {
      msgDiv.style.background = darkMode ? '#1e293b' : '#f8fafc';
      msgDiv.style.color = darkMode ? '#f1f5f9' : '#334155';
      msgDiv.style.border = darkMode ? '1px solid #334155' : '1px solid #e2e8f0';
      msgDiv.style.marginRight = 'auto';
      msgDiv.style.borderBottomLeftRadius = '4px';
    }

    const roleLabel = document.createElement('div');
    roleLabel.textContent = msg.role === 'user' 
      ? (language === 'en' ? 'You' : 'أنت')
      : (language === 'en' ? 'Assistant' : 'المساعد');
    roleLabel.style.fontWeight = '600';
    roleLabel.style.fontSize = '12px';
    roleLabel.style.marginBottom = '6px';
    roleLabel.style.opacity = '0.8';
    msgDiv.appendChild(roleLabel);

    const textDiv = document.createElement('div');
    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.style.fontSize = '13px';
    textDiv.style.lineHeight = '1.6';
    textDiv.innerHTML = msg.text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    msgDiv.appendChild(textDiv);

    const timeDiv = document.createElement('div');
    timeDiv.textContent = msg.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    timeDiv.style.fontSize = '10px';
    timeDiv.style.opacity = '0.6';
    timeDiv.style.marginTop = '6px';
    msgDiv.appendChild(timeDiv);

    container.appendChild(msgDiv);
  }

  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, { 
      scale: 2,
      useCORS: true,
      backgroundColor: darkMode ? '#0f172a' : '#ffffff'
    });
    
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const imgWidth = 595;
    const pageHeight = 842;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    const imgData = canvas.toDataURL('image/png');
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`apex-chat-${new Date().toISOString().split('T')[0]}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

export function exportChatToCSV(messages: ChatMessage[], language: 'en' | 'ar') {
  const headers = language === 'en' 
    ? ['Role', 'Timestamp', 'Message', 'Has Chart']
    : ['الدور', 'الوقت', 'الرسالة', 'يحتوي رسم'];
  
  const rows = messages.map(msg => [
    msg.role === 'user' ? (language === 'en' ? 'User' : 'مستخدم') : (language === 'en' ? 'Assistant' : 'مساعد'),
    msg.timestamp.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
    msg.text.replace(/\n/g, ' ').replace(/\*\*/g, ''),
    msg.chart ? 'Yes' : 'No'
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `apex-chat-${new Date().toISOString().split('T')[0]}.csv`);
}

export async function exportChartAsPNG(chartConfig: ChartConfig, language: 'en' | 'ar') {
  const container = document.createElement('div');
  container.style.padding = '20px';
  container.style.fontFamily = 'system-ui, sans-serif';
  container.style.background = '#ffffff';
  container.style.width = '600px';

  const title = document.createElement('h2');
  title.textContent = chartConfig.valueFormatter === 'revenue' 
    ? (language === 'en' ? 'Revenue Chart' : 'رسم بياني للإيرادات')
    : (language === 'en' ? 'Volume Chart' : 'رسم بياني للكميات');
  title.style.color = '#128d46';
  title.style.marginBottom = '16px';
  container.appendChild(title);

  const maxVal = Math.max(...chartConfig.data.map(d => d.value), 1);
  
  chartConfig.data.forEach((item) => {
    const pct = Math.max((item.value / maxVal) * 100, 2);
    const formattedVal = item.value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 });

    const row = document.createElement('div');
    row.style.marginBottom = '12px';
    
    const labelRow = document.createElement('div');
    labelRow.style.display = 'flex';
    labelRow.style.justifyContent = 'space-between';
    labelRow.style.marginBottom = '4px';
    labelRow.innerHTML = `<span style="font-weight: 600;">${item.label}</span><span style="color: #128d46; font-family: monospace;">${formattedVal}</span>`;
    row.appendChild(labelRow);

    const barBg = document.createElement('div');
    barBg.style.height = '20px';
    barBg.style.background = '#e2e8f0';
    barBg.style.borderRadius = '10px';
    barBg.style.overflow = 'hidden';
    
    const barFill = document.createElement('div');
    barFill.style.height = '100%';
    barFill.style.width = `${pct}%`;
    barFill.style.background = 'linear-gradient(90deg, #128d46, #16a854)';
    barFill.style.borderRadius = '10px';
    barBg.appendChild(barFill);
    row.appendChild(barBg);
    
    container.appendChild(row);
  });

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `apex-chart-${new Date().toISOString().split('T')[0]}.png`);
    }, 'image/png');
  } finally {
    document.body.removeChild(container);
  }
}

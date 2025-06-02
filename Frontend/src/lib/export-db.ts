import fs from 'fs';
import path from 'path';
import db from './db';

export async function exportToCSV() {
  try {
    const stmt = db.prepare('SELECT * FROM demo_requests ORDER BY created_at DESC');
    const requests = stmt.all();

    if (requests.length === 0) {
      return { success: false, message: 'No data to export' };
    }

    // Create CSV header
    const headers = Object.keys(requests[0]).join(',');
    
    // Create CSV rows
    const rows = requests.map(request => 
      Object.values(request).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );

    // Combine header and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create exports directory if it doesn't exist
    const exportDir = path.join(process.cwd(), 'database', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `demo_requests_${timestamp}.csv`;
    const filePath = path.join(exportDir, filename);

    // Write to file
    fs.writeFileSync(filePath, csvContent);

    return { 
      success: true, 
      message: 'Export successful',
      filePath 
    };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { 
      success: false, 
      message: 'Failed to export data',
      error 
    };
  }
} 
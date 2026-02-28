"use client";

import { useEffect, useState } from "react";
import { getReports, downloadReport } from "../../services/reportService";
import { formatDate } from "../../lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await getReports();
        setReports(response.data);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleDownload = async (reportId: number, title: string) => {
    try {
      const response = await downloadReport(reportId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Medical Reports</h1>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No reports available yet</p>
          <p className="text-gray-400 mt-2">Reports will appear here after predictions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{report.summary}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                {report.pdf_path && (
                  <button
                    onClick={() => handleDownload(report.id, report.title)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

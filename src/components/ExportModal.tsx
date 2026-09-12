import React, { useState } from 'react';
import { X, Download, FileText, Printer, Copy, Check, Share2 } from 'lucide-react';
import { Group, GroupSummary } from '../types/index.ts';
import { formatMoney } from '../utils/currencies.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  summary: GroupSummary;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  group,
  summary,
}) => {
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    window.open(`/api/groups/${group.id}/export.csv`, '_blank');
  };

  const generateTextSummary = () => {
    let text = `📊 *${group.name}* Expense Summary\n`;
    text += `Total Spending: ${formatMoney(summary.totalExpenseAmount, group.defaultCurrency)}\n`;
    text += `Expenses Count: ${group.expenses.length}\n\n`;

    text += `⚡ *Debts to Settle:*\n`;
    if (summary.simplifiedTransactions.length === 0) {
      text += `🎉 All debts are settled!\n`;
    } else {
      summary.simplifiedTransactions.forEach((tx) => {
        text += `• ${tx.fromMemberName} pays ${tx.toMemberName} ${formatMoney(tx.amount, tx.currency)}\n`;
      });
    }

    text += `\n⚖️ *Member Balances:*\n`;
    summary.memberBalances.forEach((mb) => {
      const sign = mb.netBalance > 0 ? '+' : '';
      text += `• ${mb.memberName}: ${sign}${formatMoney(mb.netBalance, group.defaultCurrency)} (Paid: ${formatMoney(mb.totalPaid, group.defaultCurrency)})\n`;
    });

    return text;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateTextSummary());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="export-modal"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">Export &amp; Share Summary</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-stone-600">
            Export your group's budget and simplified settlement ledger in multiple convenient formats:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* CSV */}
            <button
              onClick={handleDownloadCsv}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 hover:border-teal-500 hover:bg-teal-50/40 text-center transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-stone-900">Download CSV</span>
              <span className="text-[10px] text-stone-500 mt-0.5">Spreadsheet format</span>
            </button>

            {/* Copy for Chat */}
            <button
              onClick={handleCopyText}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 hover:border-teal-500 hover:bg-teal-50/40 text-center transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {copiedText ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </div>
              <span className="text-xs font-bold text-stone-900">
                {copiedText ? 'Copied!' : 'Copy for Chat'}
              </span>
              <span className="text-[10px] text-stone-500 mt-0.5">WhatsApp / Slack text</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-stone-200 hover:border-teal-500 hover:bg-teal-50/40 text-center transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-stone-900">Print / PDF</span>
              <span className="text-[10px] text-stone-500 mt-0.5">Printable summary</span>
            </button>
          </div>

          {/* Text preview */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Preview Text Summary
            </label>
            <textarea
              readOnly
              rows={6}
              value={generateTextSummary()}
              className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-700 focus:outline-none"
            />
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

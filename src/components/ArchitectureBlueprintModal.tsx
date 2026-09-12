import React, { useState } from 'react';
import {
  X,
  BookOpen,
  FolderTree,
  Database,
  Cpu,
  Terminal,
  Cloud,
  Layers,
  Copy,
  Check,
  Code2,
} from 'lucide-react';

interface ArchitectureBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureBlueprintModal: React.FC<ArchitectureBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schemas' | 'algorithm' | 'setup' | 'deployment'>('architecture');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-sm overflow-y-auto">
      <div
        id="architecture-blueprint-modal"
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl my-6 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-stone-900 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                KittySplit MERN Architectural Blueprint &amp; Specs
              </h2>
              <p className="text-xs text-stone-400">
                Full-Stack System Architecture, Database Schemas, Algorithms &amp; Setup Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 py-2 overflow-x-auto space-x-1 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-white shadow-xs text-teal-800 border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>1. Directory Structure</span>
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shrink-0 ${
              activeTab === 'schemas'
                ? 'bg-white shadow-xs text-teal-800 border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>2. Mongoose Schemas</span>
          </button>
          <button
            onClick={() => setActiveTab('algorithm')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shrink-0 ${
              activeTab === 'algorithm'
                ? 'bg-white shadow-xs text-teal-800 border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. Debt Algorithm</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shrink-0 ${
              activeTab === 'setup'
                ? 'bg-white shadow-xs text-teal-800 border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>4. Local Setup Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('deployment')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition shrink-0 ${
              activeTab === 'deployment'
                ? 'bg-white shadow-xs text-teal-800 border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>5. Vercel &amp; Supabase Roadmap</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-stone-800">
          {/* TAB 1: DIRECTORY STRUCTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">
                  Clean MERN Project Directory Layout
                </h3>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">
                  Modular MVC &amp; Layered Architecture
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                The application follows a clean separation of concerns: Express backend routes and services handle persistence, input validation, and business calculations, while React components deliver an interactive, responsive user experience.
              </p>

              <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`kittysplit-mern/
├── server/
│   ├── models/                  # Mongoose ODM schemas & models
│   │   └── index.ts             # Group, Member, Expense, Settlement, AuditLog
│   ├── services/
│   │   ├── debtSimplifier.ts    # Greedy min-max debt reduction algorithm
│   │   └── storageEngine.ts     # Dual-mode engine (Mongoose Atlas & local memory)
│   └── routes/
│       └── api.ts               # REST endpoints with Zod schema validation
├── src/
│   ├── components/              # Modular UI components
│   │   ├── Header.tsx           # Group selector, share & blueprint navigation
│   │   ├── AddExpenseModal.tsx  # 4 split modes (Equal, Exact, %, Shares)
│   │   ├── SimplifiedDebts.tsx  # Interactive Kittysplit debt reduction cards
│   │   ├── BalanceCard.tsx      # Member ledgers (Paid vs Fair share)
│   │   ├── ExpenseList.tsx      # Search, filter, expand drawer & deletions
│   │   ├── AnalyticsView.tsx    # Category & member contribution charts
│   │   ├── AuditLogView.tsx     # Activity timeline trail
│   │   ├── CreateGroupModal.tsx # Zero-registration group creator
│   │   ├── ShareModal.tsx       # Shareable code & direct link generator
│   │   ├── SettleModal.tsx      # Debt payment recording
│   │   └── ExportModal.tsx      # CSV, PDF/Print, and WhatsApp/Slack text export
│   ├── types/
│   │   └── index.ts             # Strict TypeScript domain interfaces
│   ├── utils/
│   │   ├── currencies.ts        # Currency exchange rates & money formatters
│   │   └── debtSimplifier.ts    # Client/server debt calculation utilities
│   ├── services/
│   │   └── api.ts               # Typed fetch/Axios client wrapper
│   ├── App.tsx                  # Main dashboard controller & state manager
│   ├── main.tsx                 # React entry point
│   └── index.css                # Tailwind CSS v4 styling
├── server.ts                    # Express + Vite middleware server entry
├── package.json                 # Scripts and dependencies
└── tsconfig.json                # TypeScript configuration`}
              </pre>
            </div>
          )}

          {/* TAB 2: MONGOOSE SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">
                  Production Mongoose ODM Schemas
                </h3>
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-semibold border border-teal-200">
                  Compound Indexes on {`{ groupId, date: -1 }`}
                </span>
              </div>
              <p className="text-xs text-stone-600">
                Schemas are optimized for fast lookups by <code className="bg-stone-100 px-1 py-0.5 rounded text-teal-800">groupId</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-teal-800">shareCode</code>, and <code className="bg-stone-100 px-1 py-0.5 rounded text-teal-800">slug</code>. Members are embedded for fast retrieval, while expenses and settlements support atomic CRUD operations.
              </p>

              <div className="space-y-4">
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Group Schema &amp; Member Sub-document
                  </h4>
                  <pre className="bg-stone-900 text-stone-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{`const MemberSchema = new Schema({
  id: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  avatarColor: { type: String, default: '#3B82F6' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const GroupSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  shareCode: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  defaultCurrency: { type: String, required: true, default: 'USD' },
  members: [MemberSchema],
  auditLogs: [AuditLogSchema]
}, { timestamps: true });`}
                  </pre>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    Expense Schema with Flexible Splits &amp; Multi-Payers
                  </h4>
                  <pre className="bg-stone-900 text-stone-200 p-3 rounded-lg text-xs font-mono overflow-x-auto">
{`const ExpenseSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  groupId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  currency: { type: String, required: true, default: 'USD' },
  exchangeRateToBase: { type: Number, default: 1.0 },
  baseAmount: { type: Number, required: true },
  category: { type: String, required: true, default: 'General' },
  date: { type: Date, required: true, default: Date.now },
  paidBy: [{
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  splitType: { type: String, enum: ['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES'], default: 'EQUAL' },
  splits: [{
    memberId: { type: String, required: true },
    memberName: { type: String, required: true },
    shareAmount: { type: Number, required: true, min: 0 },
    exactAmount: Number,
    percentage: Number,
    shares: Number
  }],
  notes: String,
  receiptUrl: String
}, { timestamps: true });

ExpenseSchema.index({ groupId: 1, date: -1 });`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEBT SIMPLIFICATION ALGORITHM */}
          {activeTab === 'algorithm' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">
                  Kittysplit Debt Simplification Algorithm
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                  O(N log N) Greedy Min-Max Matching
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                In standard group trips, debts form an NxN directed graph where everybody owes everybody else. Kittysplit simplifies this by calculating each person’s net balance: <code className="bg-stone-100 px-1 py-0.5 rounded text-teal-800">Net = (Total Paid Out of Pocket) - (Total Fair Share Consumed)</code>.
                Since the sum of net balances is zero, we partition people into debtors (negative balance) and creditors (positive balance), and greedily match the largest debtor with the largest creditor.
              </p>

              <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`function simplifyDebts(memberBalances, baseCurrency) {
  // 1. Separate debtors and creditors
  const creditors = []; // netBalance > 0
  const debtors = [];   // netBalance < 0

  for (const mb of memberBalances) {
    if (mb.netBalance > 0.009) {
      creditors.push({ id: mb.memberId, name: mb.memberName, balance: mb.netBalance });
    } else if (mb.netBalance < -0.009) {
      debtors.push({ id: mb.memberId, name: mb.memberName, balance: mb.netBalance });
    }
  }

  const simplifiedTransactions = [];

  // 2. Greedily match largest debtor with largest creditor
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.balance - a.balance); // largest positive first
    debtors.sort((a, b) => a.balance - b.balance);    // most negative first

    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    const roundedPayment = Math.round(amount * 100) / 100;

    if (roundedPayment > 0.01) {
      simplifiedTransactions.push({
        fromMemberId: debtor.id,
        fromMemberName: debtor.name,
        toMemberId: creditor.id,
        toMemberName: creditor.name,
        amount: roundedPayment,
        currency: baseCurrency
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance <= 0.009) creditors.shift();
    if (Math.abs(debtor.balance) <= 0.009) debtors.shift();
  }

  return simplifiedTransactions;
}`}
              </pre>
            </div>
          )}

          {/* TAB 4: SETUP GUIDE */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900">
                Step-by-Step Local Development Setup Guide
              </h3>
              <div className="space-y-3">
                <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50">
                  <div className="font-bold text-xs text-stone-800 mb-1">
                    Step 1: Clone and Install Dependencies
                  </div>
                  <pre className="bg-stone-900 text-stone-200 p-2.5 rounded-lg text-xs font-mono">
{`git clone https://github.com/your-org/kittysplit-mern.git
cd kittysplit-mern
npm install`}
                  </pre>
                </div>

                <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50">
                  <div className="font-bold text-xs text-stone-800 mb-1">
                    Step 2: Configure Environment Variables
                  </div>
                  <p className="text-xs text-stone-600 mb-2">
                    Create a <code className="text-teal-800 font-mono">.env</code> file in the root directory:
                  </p>
                  <pre className="bg-stone-900 text-stone-200 p-2.5 rounded-lg text-xs font-mono">
{`# Optional: MongoDB connection string (falls back to in-memory if omitted)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/kittysplit?retryWrites=true&w=majority"
PORT=3000
NODE_ENV="development"`}
                  </pre>
                </div>

                <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50">
                  <div className="font-bold text-xs text-stone-800 mb-1">
                    Step 3: Start the Development Server
                  </div>
                  <pre className="bg-stone-900 text-stone-200 p-2.5 rounded-lg text-xs font-mono">
{`npm run dev`}
                  </pre>
                  <p className="text-xs text-stone-600 mt-2">
                    The Express server boots Vite in middleware mode. Visit <code className="text-teal-800 font-mono">http://localhost:3000</code> in your browser!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FREE DEPLOYMENT GUIDE */}
          {activeTab === 'deployment' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  Complete 100% Free Deployment Guide
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  Follow these step-by-step instructions to deploy KittySplit on generous free tiers using MongoDB Atlas, Render, and Vercel/Netlify.
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1: MongoDB Atlas */}
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs text-stone-900">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Step 1: Database Setup — MongoDB Atlas (Free M0 Sandbox)</span>
                  </div>
                  <ol className="text-xs text-stone-600 space-y-1.5 list-decimal pl-4">
                    <li>Go to <a href="https://www.mongodb.com/cloud/atlas/register" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">mongodb.com/cloud/atlas</a> and register a free account.</li>
                    <li>Create a new project named <strong>KittySplit</strong> and choose the <strong>M0 (Free Forever)</strong> shared cluster tier.</li>
                    <li>Under <strong>Database Access</strong>, add a new database user (e.g. <code className="font-mono bg-stone-200 px-1 py-0.5 rounded">kitty_admin</code>) and generate a secure password.</li>
                    <li>Under <strong>Network Access</strong>, click <em>Add IP Address</em> and choose <strong>Allow Access from Anywhere (0.0.0.0/0)</strong> so cloud hosts (Render/Vercel) can connect.</li>
                    <li>Click <strong>Connect</strong> &gt; <strong>Drivers (Node.js)</strong> and copy the connection string:
                      <pre className="bg-stone-900 text-stone-200 p-2 rounded-lg font-mono text-[11px] mt-1 overflow-x-auto">
mongodb+srv://kitty_admin:&lt;PASSWORD&gt;@cluster0.xxxxx.mongodb.net/kittysplit?retryWrites=true&amp;w=majority
                      </pre>
                    </li>
                  </ol>
                </div>

                {/* Step 2: Backend on Render */}
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs text-stone-900">
                    <Cloud className="w-4 h-4 text-teal-600" />
                    <span>Step 2: Backend API Setup — Render.com (Free Web Service)</span>
                  </div>
                  <ol className="text-xs text-stone-600 space-y-1.5 list-decimal pl-4">
                    <li>Push your repository to GitHub.</li>
                    <li>Log in to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">render.com</a> and click <strong>New &gt; Web Service</strong>.</li>
                    <li>Select your GitHub repository. Configure the build parameters:
                      <div className="bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-[11px] space-y-1 mt-1">
                        <div><strong>Runtime:</strong> Node</div>
                        <div><strong>Build Command:</strong> <code className="text-emerald-700">npm install &amp;&amp; npm run build</code></div>
                        <div><strong>Start Command:</strong> <code className="text-emerald-700">npm run start</code> (or <code className="text-emerald-700">node dist/server.cjs</code>)</div>
                      </div>
                    </li>
                    <li>Add Environment Variables under <em>Environment</em>:
                      <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono text-[11px]">
                        <li><code className="text-stone-800">MONGODB_URI</code> = [Your Atlas Connection String]</li>
                        <li><code className="text-stone-800">NODE_ENV</code> = <code className="text-emerald-700">production</code></li>
                      </ul>
                    </li>
                    <li>Deploy! Render assigns a free URL like <code className="font-mono bg-stone-200 px-1 py-0.5 rounded">https://kittysplit-api.onrender.com</code>.</li>
                  </ol>
                </div>

                {/* Step 3: Frontend on Vercel or Netlify */}
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs text-stone-900">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Step 3: Frontend Deployment — Vercel / Netlify (Free Edge CDN)</span>
                  </div>
                  <ol className="text-xs text-stone-600 space-y-1.5 list-decimal pl-4">
                    <li>Log in to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold">vercel.com</a> and import your GitHub repo.</li>
                    <li>Set <strong>Framework Preset</strong> to <em>Vite</em>.</li>
                    <li>Build command: <code className="font-mono text-emerald-700">npm run build</code>, Output directory: <code className="font-mono text-emerald-700">dist</code>.</li>
                    <li>To proxy requests to your backend without CORS issues, add a <code className="font-mono">vercel.json</code> rewrites file in project root:
                      <pre className="bg-stone-900 text-stone-200 p-2 rounded-lg font-mono text-[11px] mt-1 overflow-x-auto">
{`{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://kittysplit-api.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}
                      </pre>
                    </li>
                    <li>Click <strong>Deploy</strong>. Your mobile-optimized Kittysplit web app is live with custom URL and free SSL!</li>
                  </ol>
                </div>

                {/* All-in-One Option */}
                <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50 text-emerald-950 text-xs">
                  <strong>💡 Pro Tip (Simplest All-In-One Free Option):</strong> Because this application bundles both Express API and precompiled Vite client in <code className="font-mono bg-white px-1 py-0.5 rounded">server.ts</code>, you can deploy the <em>entire stack together as a single service</em> on Render or Railway with zero separate frontend configuration!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-500">
            Kittysplit MERN Architecture • Production Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import {
  FileQuestion,
  CheckCircle2,
  Send
} from 'lucide-react';

interface RFQQuote {
  id: string;
  rfqNumber: string;
  buyerName: string;
  organization: string;
  hardwareModel: string;
  requestedQty: number;
  catalogUnitPrice: number;
  buyerTargetPrice?: number;
  submittedOfferPrice?: number;
  status: 'PENDING_OFFER' | 'OFFER_SUBMITTED' | 'ACCEPTED' | 'DECLINED';
  validUntil: string;
  notes: string;
}

export default function ResellerQuotesPage() {
  const params = useParams();
  const resellerCode = (params.code as string)?.toUpperCase();

  const [quotes, setQuotes] = useState<RFQQuote[]>([
    {
      id: 'rfq_1',
      rfqNumber: 'RFQ-CORP-2026-091',
      buyerName: 'Tariq Al-Hashimi',
      organization: 'ADNOC Digital Infrastructure Division',
      hardwareModel: 'Dell PowerEdge R760 2U Rack Server (Dual Xeon Gold, 128GB)',
      requestedQty: 12,
      catalogUnitPrice: 32500,
      buyerTargetPrice: 29500,
      submittedOfferPrice: 30200,
      status: 'OFFER_SUBMITTED',
      validUntil: '15 Oct 2026',
      notes: 'Requires dual redundant 1100W PSUs and 5 years ProSupport Plus warranty.',
    },
    {
      id: 'rfq_2',
      rfqNumber: 'RFQ-CORP-2026-094',
      buyerName: 'Vikram Mehta',
      organization: 'Emirates NBD Core Infrastructure',
      hardwareModel: 'Cisco Catalyst 9300 Series 48-Port PoE+ Managed Switch',
      requestedQty: 20,
      catalogUnitPrice: 18499,
      buyerTargetPrice: 16800,
      status: 'PENDING_OFFER',
      validUntil: '18 Oct 2026',
      notes: 'Need delivery to Dubai Silicon Oasis Data Center with Cisco DNA Premier licensing.',
    },
    {
      id: 'rfq_3',
      rfqNumber: 'RFQ-CORP-2026-088',
      buyerName: 'Ziad Mansour',
      organization: 'G42 Cloud AI Operations',
      hardwareModel: 'NVIDIA H100 80GB SXM5 GPU Accelerator Node',
      requestedQty: 4,
      catalogUnitPrice: 145000,
      buyerTargetPrice: 138000,
      submittedOfferPrice: 139500,
      status: 'ACCEPTED',
      validUntil: '30 Sep 2026',
      notes: 'Volume procurement approved by G42 Procurement Committee.',
    },
  ]);

  const [respondingQuote, setRespondingQuote] = useState<RFQQuote | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerNotes, setOfferNotes] = useState('');

  const handleOpenOfferModal = (q: RFQQuote) => {
    setRespondingQuote(q);
    setOfferPrice(String(q.submittedOfferPrice || q.buyerTargetPrice || q.catalogUnitPrice * 0.95));
    setOfferNotes('');
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingQuote) return;
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) return;

    setQuotes(prev =>
      prev.map(q =>
        q.id === respondingQuote.id
          ? { ...q, submittedOfferPrice: price, status: 'OFFER_SUBMITTED' }
          : q
      )
    );
    alert(`Wholesale offer of AED ${price.toLocaleString()} per unit sent to ${respondingQuote.organization}!`);
    setRespondingQuote(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="text-[11px] text-amber-700 font-mono uppercase font-black tracking-wider mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Enterprise B2B Commerce Desk • {resellerCode}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileQuestion className="w-7 h-7 text-amber-500" />
            <span>Corporate RFQ & Volume Quote Proposals</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Negotiate bulk enterprise hardware orders directly with corporate procurement committees across the GCC.
          </p>
        </div>
      </div>

      {/* Quote Requests Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">Active Enterprise Inquiries</h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            {quotes.length} Open RFQs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-3">RFQ # & Buyer</th>
                <th className="py-3 px-3">Hardware Product Model</th>
                <th className="py-3 px-3 text-center">Volume Qty</th>
                <th className="py-3 px-3 text-right">Catalog MSRP</th>
                <th className="py-3 px-3 text-right">Buyer Target / Offer</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-3">
                    <div className="font-mono font-black text-slate-900 text-sm">{q.rfqNumber}</div>
                    <div className="font-bold text-slate-800 mt-0.5">{q.organization}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Attn: {q.buyerName}</div>
                  </td>

                  <td className="py-4 px-3 max-w-xs">
                    <div className="font-bold text-slate-900 line-clamp-1">{q.hardwareModel}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{q.notes}</div>
                  </td>

                  <td className="py-4 px-3 text-center font-mono font-black text-slate-900 text-sm">
                    {q.requestedQty} units
                  </td>

                  <td className="py-4 px-3 text-right font-mono text-slate-500">
                    {formatPrice(q.catalogUnitPrice)}
                  </td>

                  <td className="py-4 px-3 text-right font-mono">
                    {q.submittedOfferPrice ? (
                      <div>
                        <span className="font-black text-emerald-700 text-sm">
                          {formatPrice(q.submittedOfferPrice)}
                        </span>
                        <div className="text-[10px] text-slate-400">Offer Submitted</div>
                      </div>
                    ) : q.buyerTargetPrice ? (
                      <div>
                        <span className="font-black text-amber-900 text-sm">
                          {formatPrice(q.buyerTargetPrice)}
                        </span>
                        <div className="text-[10px] text-slate-400">Target Budget</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Open Bid</span>
                    )}
                  </td>

                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-black uppercase ${
                        q.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : q.status === 'OFFER_SUBMITTED'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {q.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {q.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-4 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenOfferModal(q)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shadow-xs cursor-pointer"
                    >
                      {q.status === 'OFFER_SUBMITTED' ? 'Revise Offer' : 'Submit Quote'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Response Modal */}
      {respondingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-amber-700 font-bold uppercase">
                  Wholesale Volume Counter-Proposal
                </div>
                <h3 className="text-lg font-black text-slate-900">{respondingQuote.rfqNumber}</h3>
                <p className="text-xs text-slate-500">{respondingQuote.organization}</p>
              </div>
              <button
                type="button"
                onClick={() => setRespondingQuote(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{respondingQuote.hardwareModel}</div>
                <div className="text-slate-500 font-mono">
                  Requested Volume: <strong>{respondingQuote.requestedQty} units</strong> • MSRP: {formatPrice(respondingQuote.catalogUnitPrice)}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Proposed Wholesale Unit Price (AED) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  className="w-full font-mono text-sm font-black bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  Total Deal Volume Value: <strong>{formatPrice((parseFloat(offerPrice) || 0) * respondingQuote.requestedQty)}</strong>
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Commercial Notes / Lead Time</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Delivery within 48 hours to JAFZA hub. Includes standard 3-year enterprise warranty."
                  value={offerNotes}
                  onChange={e => setOfferNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRespondingQuote(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Quote Offer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

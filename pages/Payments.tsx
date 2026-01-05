import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { supabaseMock } from '../services/supabaseMock';
import { AppRole, Transaction } from '../types';
import { 
  History, Wallet, ShieldCheck, 
  Plus, Loader2, X, FileText, Download, Printer, CreditCard
} from 'lucide-react';

const Payments: React.FC = () => {
  const navigate = useNavigate();
  const session = supabaseMock.auth.getSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(25000);
  
  const [payingFor, setPayingFor] = useState<'self' | string>('self');

  const isDarkMode = document.documentElement.classList.contains('dark');
  const logoUrl = isDarkMode 
    ? "https://i.ibb.co/Kcdk8c1x/Photoroom-20251210-193802.png" 
    : "https://i.ibb.co/35GKJS4x/Photoroom-20251210-193746.png";

  useEffect(() => {
    if (session?.user?.id) {
      supabaseMock.db.getTransactions(session.user.id).then(setTransactions);
    }
  }, [session?.user?.id]);

  const totalBalance = useMemo(() => {
    return transactions
      .filter(tx => tx.status === 'success')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  // Calculate outstanding bills (pending transactions)
  const outstandingBills = useMemo(() => {
    return transactions
      .filter(tx => tx.status !== 'success')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const handleMakePayment = () => {
    // Check if there are outstanding bills
    if (outstandingBills > 0) {
      // Show bill payment modal
      setPaymentAmount(outstandingBills);
      setShowBillModal(true);
    } else {
      // No bills - ask if they want to enroll for a new course
      alert('No outstanding bills. Redirecting to course catalog to enroll in a new course.');
      navigate('/courses');
    }
  };

  const initiatePaymentGateway = () => {
    const targetId = payingFor === 'self' ? session.user.id : payingFor;
    
    // Close modals and redirect to gateway
    setShowPayModal(false);
    setShowBillModal(false);
    navigate('/payment-gateway', {
      state: {
        type: 'recharge',
        amount: paymentAmount,
        targetId: targetId,
        role: session?.user?.role || AppRole.STUDENT
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 text-slate-900 dark:text-white leading-none uppercase">Financial Node</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Manage your academic investments.</p>
          </div>
          <button onClick={handleMakePayment} className="flex items-center gap-3 px-10 py-5 bg-purple-gradient text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all group border border-white/5">
            <CreditCard size={20} className="group-hover:rotate-12 transition-transform" /> Make Payment
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-8">
            <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
               <div className="absolute top-0 right-0 p-10 opacity-5"><Wallet size={160} /></div>
               <Wallet className="text-purple-400 mb-10" size={40} />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Platform Inflow Ledger</p>
               <h3 className="text-5xl lg:text-6xl font-black mb-12 tracking-tighter">₦{totalBalance.toLocaleString()}</h3>
               <div className="flex justify-between items-end border-t border-white/5 pt-8">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Assigned Node</p>
                    <p className="text-md font-bold tracking-tight">{session?.user?.full_name}</p>
                  </div>
                  <ShieldCheck className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" size={28} />
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
             <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-4"><History size={28} className="text-purple-600" /> Transaction Audit</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-inner border border-slate-100 dark:border-slate-700">{transactions.length} ENTRIES</span>
             </div>
             <div className="divide-y divide-slate-100 dark:divide-slate-700">
               {transactions.map(tx => (
                 <div 
                   key={tx.id} 
                   onClick={() => setSelectedTx(tx)}
                   className="p-8 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all group"
                 >
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-slate-400 group-hover:bg-purple-gradient group-hover:text-white transition-all shadow-inner group-hover:shadow-xl"><FileText size={24} /></div>
                       <div>
                          <p className="font-black text-lg text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors leading-none mb-1.5">{tx.item_name}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()} • REF: {tx.reference.substring(0, 8).toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-xl text-slate-900 dark:text-white">₦{tx.amount.toLocaleString()}</p>
                       <p className="text-[9px] font-black uppercase tracking-widest text-green-500 flex items-center justify-end gap-1.5 mt-1">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Verified Node
                       </p>
                    </div>
                 </div>
               ))}
               {transactions.length === 0 && (
                 <div className="py-40 text-center opacity-30 flex flex-col items-center">
                    <History size={64} className="mb-6" />
                    <p className="font-black uppercase text-xs tracking-[0.3em]">No financial logs retrieved</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
              <div className="p-12 text-center relative border-b border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                 <button onClick={() => setSelectedTx(null)} className="absolute top-8 right-8 p-3 text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"><X size={24} /></button>
                 <img src={logoUrl} className="h-32 mx-auto mb-10" alt="" />
                 <h2 className="text-3xl font-black mb-1 leading-none tracking-tight">Academic Receipt</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Node Sync: {selectedTx.reference.toUpperCase()}</p>
              </div>
              
              <div className="p-12 space-y-10">
                 <div className="p-10 bg-slate-100 dark:bg-slate-950 rounded-[3rem] text-center border-2 border-slate-50 dark:border-slate-800 shadow-inner">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Total Node Deployment Value</p>
                    <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">₦{selectedTx.amount.toLocaleString()}</h3>
                 </div>
                 <div className="flex gap-4">
                    <button className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                       <Download size={18} /> Export Node
                    </button>
                    <button className="flex-1 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                       <Printer size={18} /> Print Sync
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showBillModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
             <div className="bg-slate-950 p-12 text-white text-center relative border-b border-white/5">
                <button onClick={() => setShowBillModal(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white active:scale-90 transition-all"><X size={24} /></button>
                <h2 className="text-3xl font-black mb-2 leading-none tracking-tight">Outstanding Bills</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Amount Due</p>
             </div>
             
             <div className="p-12 space-y-10">
                <div className="p-10 bg-slate-100 dark:bg-slate-950 rounded-[3rem] text-center border-2 border-slate-50 dark:border-slate-800 shadow-inner">
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Total Amount Due</p>
                   <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">₦{outstandingBills.toLocaleString()}</h3>
                </div>
                
                <button onClick={initiatePaymentGateway} className="w-full py-6 bg-purple-gradient text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                   <ShieldCheck size={20} />
                   Pay Outstanding Bills
                </button>
             </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
             <div className="bg-slate-950 p-12 text-white text-center relative border-b border-white/5">
                <button onClick={() => setShowPayModal(false)} className="absolute top-8 left-8 text-slate-500 hover:text-white active:scale-90 transition-all"><X size={24} /></button>
                <div className="flex items-center justify-center gap-3 mb-3">
                   <span className="text-3xl font-black opacity-20">₦</span>
                   <input type="number" className="bg-transparent text-5xl font-black text-center w-48 outline-none tracking-tighter" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Deploy Tuition Credit</p>
             </div>
             
             <div className="p-10 space-y-8">
                <button onClick={initiatePaymentGateway} className="w-full py-6 bg-[#3bb75e] text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                   <ShieldCheck size={20} />
                   CONTINUE TO AUTHORIZATION
                </button>
             </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Payments;
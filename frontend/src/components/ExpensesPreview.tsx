import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Data type to hold backend data returned
// Data shape for an expense preview prop
interface ExpensesPreviewProps {
  tripId: number;
  sqlUserId: number;
  onOpenPopup: () => void;
}
// Data shape for an expense, should probably break these shared data types and functions into their own files soon
interface Expense {
  id: number;
  description: string;
  amount: number;
  paid_by: string;
}

export default function ExpensesPreview({ tripId, sqlUserId, onOpenPopup }: ExpensesPreviewProps) {
  // State for the expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  // Grab the expenses from the backend when the trip changes
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        // Grab the expenses from the backend
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses/trip/${tripId}`);
        // Set the state to display in the preview
        setExpenses(res.data);
      } catch (err) {
        console.error('Failed to load expenses:', err);
      }
    };
    fetchExpenses();
  }, [tripId]);

  return (
    <div className="bg-neutral-800 p-6 rounded-xl shadow space-y-4">
      {/* Section title */}
      <h2 className="text-xl font-semibold text-amber-200">Recent Expenses</h2>
      {/* Scrollable list showing up to the 5 most recent expenses */}
      <ul className="text-sm text-white space-y-2 max-h-40 overflow-y-auto">
        {expenses.slice(0, 5).map((e) => (
          <li key={e.id} className="flex justify-between">
            <span>
              {e.description} <span className="text-gray-400">({e.paid_by})</span>
            </span>
            {/* Right side: amount formatted as currency */}
            <span>${Number(e.amount).toFixed(2)}</span>
          </li>
        ))}
        {/* Empty state when there are no expenses at all */}
        {expenses.length === 0 && <li className="text-gray-400">No expenses yet.</li>}
      </ul>
      {/* Footer action: opens the full expenses popup */}
      <div className="flex justify-end">
        <button
          onClick={onOpenPopup}
          className="text-sm text-blue-400 hover:underline mt-2"
        >
          View All
        </button>
      </div>
    </div>
  );
}
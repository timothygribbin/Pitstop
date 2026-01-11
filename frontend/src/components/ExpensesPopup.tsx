import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Data types for the returned data from the backend
// ExpensePopupProps data shape
interface ExpensesPopupProps {
    tripId: number;
    sqlUserId: number;
    onClose: () => void;
}
// Expense Data Shape
interface Expense {
    id: number;
    description: string;
    amount: number;
    paid_by: string;
}

export default function ExpensesPopup({ tripId, sqlUserId, onClose }: ExpensesPopupProps) {
    // State for the expenses
    const [expenses, setExpenses] = useState<Expense[]>([]);
    // State for the description
    const [description, setDescription] = useState('');
    // State for the amount
    const [amount, setAmount] = useState('');

const fetchExpenses = async () => {
    // Get the expenses from the backend
    try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses/trip/${tripId}`);
    // Set expenses in the state
    setExpenses(res.data);
    } catch (err) {
    console.error('Failed to load expenses:', err);
    }
};
// Fetch expenses whenver the trip changes
useEffect(() => {
fetchExpenses();
}, [tripId]);
// Handler for the expenses submission form
const handleSubmit = async () => {
    // Ensure there are non empty values for description and amount
    if (!description || !amount) return;
    // Submit the new expense to the backend
    try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/expenses`, {
        trip_id: tripId,
        user_id: sqlUserId,
        description,
        amount: parseFloat(amount),
    });
        // Set the expense info in the state
        setDescription('');
        setAmount('');
        fetchExpenses();
    } catch (err) {
    console.error('Failed to add expense:', err);
    }
    };

return (

    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
    {/* Popup container/card */}
    <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-2xl shadow-lg space-y-4 relative">
    {/* Close button  */}
    <button onClick={onClose} className="absolute top-2 right-3 text-white text-xl font-bold">&times;</button>
    {/* Title */}
    <h2 className="text-2xl font-semibold text-amber-300">All Expenses</h2>
    {/* Expense list section */}
    <div className="space-y-2">
        {expenses.length === 0 ? (
        <p className="text-gray-400">No expenses recorded.</p>
        ) : (
        <ul className="space-y-2 text-sm max-h-72 overflow-y-auto">
        {expenses.map(e => (
        <li key={e.id} className="flex justify-between border-b border-zinc-700 pb-1">
            {/* Right side: formatted currency amount */}
            <span>{e.description} <span className="text-gray-400">({e.paid_by})</span></span>
            {/* Right side: formatted currency amount */}
            <span>${Number(e.amount).toFixed(2)}</span>
            </li>
        ))}
        </ul>
        )}
    </div>
    {/* Add new expense section */}
    <div className="pt-4 border-t border-zinc-700">
        <h3 className="text-lg font-semibold text-emerald-400">Add New Expense</h3>
        
        <div className="flex gap-2 mt-2">
        {/* Description input */}
        <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="flex-1 px-3 py-2 bg-zinc-800 text-white rounded"
        />
        {/* Amount input */}
        <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="$"
        type="number"
        className="w-24 px-3 py-2 bg-zinc-800 text-white rounded"
        />
        {/* Submit button: adds expense */}
        <button
        onClick={handleSubmit}
        className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-4 py-2 rounded"
        >
        Add
        </button>
        </div>
        </div>
    </div>
    </div>
    );
}

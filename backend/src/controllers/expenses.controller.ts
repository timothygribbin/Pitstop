import { Request, Response } from 'express';
import { db } from '../db/db';

export const addExpense = async (req: Request, res: Response) => {
  // Get the trip and user ids, the description and the amount of the expense from the request body
  const { trip_id, user_id, description, amount } = req.body;
  // Ensure all fields are valid
  if (!trip_id || !user_id || !description || amount == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Insert the expense into the expense table to track it
  try {
    await db.query(
      'INSERT INTO trip_expenses (trip_id, user_id, description, amount) VALUES (?, ?, ?, ?)',
      [trip_id, user_id, description, amount]
    );
    res.status(201).json({ message: 'Expense added' });
    // Catch the error if there is one
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
};

export const getExpensesByTrip = async (req: Request, res: Response) => {
  // Get the trip ID from the request params
  const { tripId } = req.params;
  // Load trip expenses in a single query, joining users lets us avoid extra queries to gather who paid for it
  try {
    const [expenses] = await db.query(
      `SELECT e.*, u.name AS paid_by 
       FROM trip_expenses e
       JOIN users u ON e.user_id = u.id
       WHERE e.trip_id = ?`,
      [tripId]
    );
    res.json(expenses);
    // Catch the error
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};


export const updateExpense = async (req: Request, res: Response) => {
  // Extract the fields from the request body and parameters
  const { expenseId } = req.params;
  const { description, amount } = req.body;
  // Ensure fields are valid
  if (!description || amount == null || !expenseId) {
    return res.status(400).json({ error: 'Missing fields for update' });
  }

  try {
    // Update the trip expense in the table
    await db.query(
      `UPDATE trip_expenses
       SET description = ?, amount = ?
       WHERE id = ?`,
      [description, amount, expenseId]
    );
    res.status(200).json({ message: 'Expense updated' });
    // Catch the error 
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  // Extract expense ID from the request paramters
  const { expenseId } = req.params;

  try {
    // Delete the expense 
    await db.query(
      `DELETE FROM trip_expenses WHERE id = ?`,
      [expenseId]
    );
    res.status(200).json({ message: 'Expense deleted' });
    // Catches if the expense ID does not exist
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
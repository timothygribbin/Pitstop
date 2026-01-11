import express, { RequestHandler } from 'express';
import {
  addExpense,
  getExpensesByTrip,
  updateExpense,
  deleteExpense,
} from '../controllers/expenses.controller';

const router = express.Router();

// Create a new expense
router.post('/', addExpense as RequestHandler);

// Get all expenses for a trip
router.get('/trip/:tripId', getExpensesByTrip);

// Update an expense
router.put('/:expenseId', updateExpense as RequestHandler);

// Delete an expense
router.delete('/:expenseId', deleteExpense);

export default router;
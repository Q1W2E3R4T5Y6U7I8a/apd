import React, { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import './Finance.scss';

const STORAGE_KEY = 'apd-finance-v1';

const defaultExpenseCategories = [
  { id: 'food', label: 'Food', icon: '🍜', color: '#18c47d' },
  { id: 'transport', label: 'Transport', icon: '◈', color: '#1877e8' },
  { id: 'home', label: 'Home', icon: '⌂', color: '#f4b942' },
  { id: 'health', label: 'Health', icon: '✚', color: '#ec3e4f' },
  { id: 'fun', label: 'Leisure', icon: '✦', color: '#9b66ee' },
  { id: 'shopping', label: 'Shopping', icon: '◌', color: '#ed5d94' },
  { id: 'education', label: 'Growth', icon: '↗', color: '#22a8aa' },
];

const defaultIncomeCategories = [
  { id: 'income', label: 'General', icon: '↑', color: '#18c47d' },
  { id: 'salary', label: 'Salary', icon: '💼', color: '#1877e8' },
  { id: 'freelance', label: 'Freelance', icon: '✎', color: '#9b66ee' },
  { id: 'investments', label: 'Investments', icon: '⇧', color: '#22a8aa' },
  { id: 'gifts', label: 'Gifts', icon: '❋', color: '#ed5d94' },
];

const unknownCategory = { id: 'unknown', label: 'Archived', icon: '•', color: '#999' };

const emptyFinanceData = {
  currency: 'CHF',
  accounts: [
    { id: 'main-account', name: 'Main account', balance: 0, color: '#1877e8' },
    { id: 'cash', name: 'Cash', balance: 0, color: '#18c47d' },
  ],
  categories: {
    expense: defaultExpenseCategories,
    income: defaultIncomeCategories,
  },
  budgets: {
    expense: Object.fromEntries(defaultExpenseCategories.map((category) => [category.id, 0])),
    income: Object.fromEntries(defaultIncomeCategories.map((category) => [category.id, 0])),
  },
  transactions: [],
};

const today = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);

const loadFinanceData = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return emptyFinanceData;

    // Older saves stored a flat categories array (expenses only) and a flat
    // budgets map. Migrate those into the new { expense, income } shape
    // without losing anything the person already set up.
    const savedCategories = saved.categories;
    const isLegacyCategories = Array.isArray(savedCategories);
    const expenseCategories = isLegacyCategories
      ? (savedCategories.length ? savedCategories : emptyFinanceData.categories.expense)
      : (savedCategories?.expense?.length ? savedCategories.expense : emptyFinanceData.categories.expense);
    const incomeCategories = (!isLegacyCategories && savedCategories?.income?.length)
      ? savedCategories.income
      : emptyFinanceData.categories.income;

    const savedBudgets = saved.budgets || {};
    const hasSplitBudgets = 'expense' in savedBudgets || 'income' in savedBudgets;
    const expenseBudgets = hasSplitBudgets ? (savedBudgets.expense || {}) : savedBudgets;
    const incomeBudgets = hasSplitBudgets ? (savedBudgets.income || {}) : {};

    return {
      ...emptyFinanceData,
      ...saved,
      accounts: saved.accounts?.length ? saved.accounts : emptyFinanceData.accounts,
      categories: { expense: expenseCategories, income: incomeCategories },
      budgets: {
        expense: { ...emptyFinanceData.budgets.expense, ...expenseBudgets },
        income: { ...emptyFinanceData.budgets.income, ...incomeBudgets },
      },
      transactions: saved.transactions || [],
    };
  } catch (error) {
    console.error('Could not load finance data:', error);
    return emptyFinanceData;
  }
};

const transactionId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const SHEET_NAME = 'APD';
const SHEET_HEADERS = [
  'EntryType', 'Id', 'Name', 'Balance', 'Color', 'Icon', 'Kind',
  'Category', 'Budget', 'Date', 'Type', 'Amount', 'AccountId', 'Note',
];

export default function Finance() {
  const [finance, setFinance] = useState(loadFinanceData);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', balance: '' });
  const [budgetTab, setBudgetTab] = useState('expense');
  const [newCategory, setNewCategory] = useState({ label: '', color: '#22a8aa' });
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: 'food',
    accountId: 'main-account',
    note: '',
    date: today(),
  });
  const fileInputRef = useRef(null);

  const updateFinance = (updater) => {
    setFinance((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const expenseCategories = finance.categories?.expense || defaultExpenseCategories;
  const incomeCategories = finance.categories?.income || defaultIncomeCategories;

  const money = useMemo(
    () => new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: finance.currency,
      maximumFractionDigits: 0,
    }),
    [finance.currency]
  );

  const monthTransactions = useMemo(
    () => finance.transactions.filter((transaction) => transaction.date?.slice(0, 7) === monthKey()),
    [finance.transactions]
  );

  const totals = useMemo(() => {
    const income = monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const spending = monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      income,
      spending,
      balance: finance.accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
      expenseBudget: Object.values(finance.budgets.expense).reduce((sum, value) => sum + Number(value || 0), 0),
      incomeGoal: Object.values(finance.budgets.income).reduce((sum, value) => sum + Number(value || 0), 0),
    };
  }, [finance.accounts, finance.budgets, monthTransactions]);

  const spendingByCategory = useMemo(
    () => monthTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((summary, transaction) => ({
        ...summary,
        [transaction.category]: (summary[transaction.category] || 0) + transaction.amount,
      }), {}),
    [monthTransactions]
  );

  const incomeByCategory = useMemo(
    () => monthTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((summary, transaction) => ({
        ...summary,
        [transaction.category]: (summary[transaction.category] || 0) + transaction.amount,
      }), {}),
    [monthTransactions]
  );

  const incomeBreakdown = useMemo(() => {
    const total = totals.income;
    return incomeCategories
      .map((category) => {
        const amount = incomeByCategory[category.id] || 0;
        return {
          id: category.id,
          label: category.label,
          color: category.color,
          amount,
          percent: total ? (amount / total) * 100 : 0,
        };
      })
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [incomeByCategory, incomeCategories, totals.income]);

  const recentTransactions = useMemo(
    () => [...finance.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
      .slice(0, 7),
    [finance.transactions]
  );

  const setCurrency = (currency) => updateFinance((current) => ({ ...current, currency }));

  const updateBudget = (kind, categoryId, value) => {
    const amount = Math.max(0, Number(value) || 0);
    updateFinance((current) => ({
      ...current,
      budgets: { ...current.budgets, [kind]: { ...current.budgets[kind], [categoryId]: amount } },
    }));
  };

  const addCategory = (event) => {
    event.preventDefault();
    const label = newCategory.label.trim();
    if (!label) return;

    const id = `${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    updateFinance((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [budgetTab]: [
          ...current.categories[budgetTab],
          { id, label, icon: '◌', color: newCategory.color || '#22a8aa' },
        ],
      },
      budgets: {
        ...current.budgets,
        [budgetTab]: { ...current.budgets[budgetTab], [id]: 0 },
      },
    }));

    setNewCategory({ label: '', color: '#22a8aa' });
  };

  const deleteCategory = (kind, categoryId) => {
    updateFinance((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [kind]: current.categories[kind].filter((category) => category.id !== categoryId),
      },
      budgets: {
        ...current.budgets,
        [kind]: Object.fromEntries(Object.entries(current.budgets[kind]).filter(([key]) => key !== categoryId)),
      },
    }));
  };

  const updateAccountField = (accountId, field, value) => {
    updateFinance((current) => ({
      ...current,
      accounts: current.accounts.map((account) => (
        account.id === accountId
          ? { ...account, [field]: field === 'balance' ? Number(value) || 0 : value }
          : account
      )),
    }));
  };

  const moveAccount = (accountId, direction) => {
    updateFinance((current) => {
      const index = current.accounts.findIndex((account) => account.id === accountId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.accounts.length) return current;
      const accounts = [...current.accounts];
      [accounts[index], accounts[target]] = [accounts[target], accounts[index]];
      return { ...current, accounts };
    });
  };

  const deleteAccount = (accountId) => {
    updateFinance((current) => ({
      ...current,
      accounts: current.accounts.filter((account) => account.id !== accountId),
    }));
  };

  const addTransaction = (event) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0 || !form.accountId || !form.category) return;

    const transaction = {
      id: transactionId(),
      type: form.type,
      amount,
      category: form.category,
      accountId: form.accountId,
      note: form.note.trim() || (form.type === 'income' ? 'Income' : 'New expense'),
      date: form.date,
      createdAt: Date.now(),
    };

    updateFinance((current) => ({
      ...current,
      transactions: [transaction, ...current.transactions],
      accounts: current.accounts.map((account) => (
        account.id === transaction.accountId
          ? {
            ...account,
            balance: Number(account.balance || 0) + (transaction.type === 'income' ? amount : -amount),
          }
          : account
      )),
    }));

    setForm((current) => ({ ...current, amount: '', note: '', date: today() }));
  };

  const deleteTransaction = (transaction) => {
    updateFinance((current) => ({
      ...current,
      transactions: current.transactions.filter((item) => item.id !== transaction.id),
      accounts: current.accounts.map((account) => (
        account.id === transaction.accountId
          ? {
            ...account,
            balance: Number(account.balance || 0) + (transaction.type === 'income' ? -transaction.amount : transaction.amount),
          }
          : account
      )),
    }));
  };

  const addAccount = (event) => {
    event.preventDefault();
    const name = newAccount.name.trim();
    if (!name) return;

    const accountColors = ['#18c47d', '#1877e8', '#ec3e4f', '#9b66ee'];
    updateFinance((current) => ({
      ...current,
      accounts: [
        ...current.accounts,
        {
          id: transactionId(),
          name,
          balance: Number(newAccount.balance) || 0,
          color: accountColors[current.accounts.length % accountColors.length],
        },
      ],
    }));
    setNewAccount({ name: '', balance: '' });
    setShowAccountForm(false);
  };

  const categoryFor = (categoryId) => (
    [...expenseCategories, ...incomeCategories].find((category) => category.id === categoryId) || unknownCategory
  );

  const expenseBudgetProgress = totals.expenseBudget > 0 ? Math.min((totals.spending / totals.expenseBudget) * 100, 100) : 0;
  const expenseBudgetRemaining = totals.expenseBudget - totals.spending;
  const incomeGoalProgress = totals.incomeGoal > 0 ? Math.min((totals.income / totals.incomeGoal) * 100, 100) : 0;
  const incomeGoalRemaining = totals.incomeGoal - totals.income;

  const analytics = useMemo(() => {
    const transactions = finance.transactions || [];
    const accounts = finance.accounts || [];
    const expenseBudgets = finance.budgets?.expense || {};

    const monthLabels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return date.toLocaleString('default', { month: 'short' });
    });

    const monthKeys = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });

    const monthStats = monthKeys.map((month) => ({ month, income: 0, spending: 0, net: 0 }));
    let totalIncome = 0;
    let totalSpending = 0;
    let biggestIncome = 0;
    let biggestSpending = 0;

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;
      const month = transaction.date?.slice(0, 7);

      if (transaction.type === 'income') {
        totalIncome += amount;
        biggestIncome = Math.max(biggestIncome, amount);
      }

      if (transaction.type === 'expense') {
        totalSpending += amount;
        biggestSpending = Math.max(biggestSpending, amount);
      }

      const stats = monthStats.find((row) => row.month === month);
      if (stats) {
        if (transaction.type === 'income') stats.income += amount;
        if (transaction.type === 'expense') stats.spending += amount;
        stats.net = stats.income - stats.spending;
      }
    });

    const averageBudgetUsage = (() => {
      const budgeted = expenseCategories.filter((category) => Number(expenseBudgets[category.id] || 0) > 0);
      if (!budgeted.length) return 0;
      const totalUsage = budgeted.reduce((sum, category) => {
        const spent = monthTransactions
          .filter((transaction) => transaction.type === 'expense' && transaction.category === category.id)
          .reduce((innerSum, transaction) => innerSum + Number(transaction.amount || 0), 0);
        return sum + (spent / Math.max(1, Number(expenseBudgets[category.id] || 0)));
      }, 0);
      return totalUsage / budgeted.length;
    })();

    const averageGrowth = monthStats.reduce((sum, item) => sum + item.net, 0) / monthStats.length;
    const spendingShare = totalIncome || totalSpending ? (totalSpending / Math.max(1, totalIncome + totalSpending)) * 100 : 0;
    const earningShare = totalIncome || totalSpending ? (totalIncome / Math.max(1, totalIncome + totalSpending)) * 100 : 0;

    const allValues = [...monthStats.flatMap((item) => [item.income, item.spending, item.net]), 0];
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues, 1);
    const range = maxValue - minValue || 1;

    const linePath = (values) => values.map((value, index) => {
      const x = 26 + index * 42;
      const y = 132 - ((value - minValue) / range) * 100;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');

    // Only accounts with a positive balance count as an "asset" here — this
    // keeps the donut, the legend and the conic-gradient all derived from
    // the exact same filtered list, so they can never drift apart.
    const assetValues = accounts.map((account) => ({
      id: account.id,
      name: account.name || 'Account',
      color: account.color || '#1877e8',
      value: Math.max(0, Number(account.balance) || 0),
    })).filter((entry) => entry.value > 0);
    const assetTotal = assetValues.reduce((sum, entry) => sum + entry.value, 0);

    const assetLegend = assetValues.map((entry) => ({
      ...entry,
      percent: assetTotal ? (entry.value / assetTotal) * 100 : 0,
    }));

    const assetBackground = assetLegend.length > 0
      ? `conic-gradient(${assetLegend.map((entry, index) => {
        const start = assetLegend.slice(0, index).reduce((sum, item) => sum + item.percent, 0);
        const end = start + entry.percent;
        return `${entry.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      }).join(', ')})`
      : '#e6ece0';

    return {
      monthLabels,
      monthStats,
      ratio: totalSpending ? totalIncome / totalSpending : totalIncome ? Infinity : 0,
      averageBudgetUsage,
      averageGrowth,
      biggestIncome,
      biggestSpending,
      spendingShare,
      earningShare,
      totalIncome,
      totalSpending,
      assetLegend,
      assetTotal,
      assetBackground,
      linePaths: {
        income: linePath(monthStats.map((item) => item.income)),
        spending: linePath(monthStats.map((item) => item.spending)),
        total: linePath(monthStats.map((item) => item.net)),
      },
      minValue,
      maxValue,
      formatPercent: (value) => `${Math.round(value)}%`,
      formatCurrency: (value) => money.format(value),
    };
  }, [finance.accounts, finance.budgets, finance.transactions, expenseCategories, money, monthTransactions]);

  const exportFinanceToXlsx = () => {
    const workbook = XLSX.utils.book_new();

    const blankRow = {
      EntryType: '', Id: '', Name: '', Balance: '', Color: '', Icon: '', Kind: '',
      Category: '', Budget: '', Date: '', Type: '', Amount: '', AccountId: '', Note: '',
    };

    const rows = [
      ...finance.accounts.map((account) => ({
        ...blankRow,
        EntryType: 'Account',
        Id: account.id,
        Name: account.name,
        Balance: account.balance,
        Color: account.color,
      })),
      ...['expense', 'income'].flatMap((kind) => finance.categories[kind].map((category) => ({
        ...blankRow,
        EntryType: 'Category',
        Id: category.id,
        Name: category.label,
        Color: category.color,
        Icon: category.icon,
        Kind: kind,
      }))),
      ...['expense', 'income'].flatMap((kind) => Object.entries(finance.budgets[kind]).map(([category, limit]) => ({
        ...blankRow,
        EntryType: 'Budget',
        Category: category,
        Budget: limit,
        Kind: kind,
      }))),
      ...finance.transactions.map((transaction) => ({
        ...blankRow,
        EntryType: 'Transaction',
        Id: transaction.id,
        Category: transaction.category,
        Date: transaction.date,
        Type: transaction.type,
        Amount: transaction.amount,
        AccountId: transaction.accountId,
        Note: transaction.note,
      })),
    ];

    const sheet = XLSX.utils.json_to_sheet(rows, { header: SHEET_HEADERS });
    XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);

    const workbookArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([workbookArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'apd-finance.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const triggerXlsxImport = () => {
    fileInputRef.current?.click();
  };

  const importFinanceFromXlsx = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames.includes(SHEET_NAME) ? SHEET_NAME : workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const importedRows = sheet ? XLSX.utils.sheet_to_json(sheet, { defval: '' }) : [];

    const importedAccounts = [];
    const importedCategories = { expense: [], income: [] };
    const importedBudgets = { expense: [], income: [] };
    const importedTransactions = [];

    importedRows.forEach((row, index) => {
      const type = (row.EntryType || row.entryType || '').toString().trim();
      const kind = (row.Kind || row.kind || 'expense').toString().trim() === 'income' ? 'income' : 'expense';

      if (type === 'Account') {
        importedAccounts.push({
          id: row.Id || `imported-account-${index}`,
          name: row.Name || `Account ${index + 1}`,
          balance: Number(row.Balance || 0),
          color: row.Color || ['#18c47d', '#1877e8', '#ec3e4f', '#9b66ee'][index % 4],
        });
      }

      if (type === 'Category') {
        const id = (row.Id || '').toString().trim();
        if (id) {
          importedCategories[kind].push({
            id,
            label: row.Name || id,
            icon: row.Icon || '◌',
            color: row.Color || '#22a8aa',
          });
        }
      }

      if (type === 'Budget') {
        const key = (row.Category || '').toString().trim();
        if (key) {
          importedBudgets[kind].push({ key, value: Number(row.Budget || 0) });
        }
      }

      if (type === 'Transaction') {
        importedTransactions.push({
          id: row.Id || `imported-trans-${index}`,
          type: row.Type?.toString().toLowerCase().includes('income') ? 'income' : 'expense',
          amount: Number(row.Amount || 0),
          category: row.Category || 'food',
          accountId: row.AccountId || 'main-account',
          note: row.Note || '',
          date: row.Date || today(),
          createdAt: Date.now() + index,
        });
      }
    });

    const normalizedBudgets = {
      expense: importedBudgets.expense.reduce((result, row) => ({ ...result, [row.key]: Number(row.value || 0) }), {}),
      income: importedBudgets.income.reduce((result, row) => ({ ...result, [row.key]: Number(row.value || 0) }), {}),
    };

    updateFinance((current) => ({
      ...current,
      accounts: importedAccounts.length ? importedAccounts : current.accounts,
      categories: {
        expense: importedCategories.expense.length ? importedCategories.expense : current.categories.expense,
        income: importedCategories.income.length ? importedCategories.income : current.categories.income,
      },
      budgets: {
        expense: { ...current.budgets.expense, ...normalizedBudgets.expense },
        income: { ...current.budgets.income, ...normalizedBudgets.income },
      },
      transactions: importedTransactions.length ? importedTransactions : current.transactions,
    }));
    event.target.value = '';
  };

  return (
    <section className="finance-page">
      <header className="finance-hero">
        <div>
          <p className="finance-kicker">PERSONAL CAPITAL // THIS MONTH</p>
          <h1>Finance system</h1>
          <p className="finance-caption">Your money, accounts and limits — all in one local dashboard.</p>
        </div>
        <label className="currency-control">
          <span>Currency</span>
          <select value={finance.currency} onChange={(event) => setCurrency(event.target.value)} aria-label="Display currency">
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="PLN">PLN</option>
          </select>
        </label>
      </header>

      <div className="finance-actions">
        <button type="button" className="xlsx-button" onClick={exportFinanceToXlsx}>Export .xlsx</button>
        <button type="button" className="xlsx-button" onClick={triggerXlsxImport}>Import .xlsx</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          style={{ display: 'none' }}
          onChange={importFinanceFromXlsx}
        />
      </div>

      <div className="finance-metrics">
        <article className="finance-metric balance-metric">
          <span>Available now</span>
          <strong>{money.format(totals.balance)}</strong>
          <small>Across {finance.accounts.length} account{finance.accounts.length === 1 ? '' : 's'}</small>
        </article>
        <article className="finance-metric income-metric">
          <span>Income</span>
          <strong>+{money.format(totals.income)}</strong>
          <small>Month to date</small>
        </article>
        <article className="finance-metric expense-metric">
          <span>Spent</span>
          <strong>-{money.format(totals.spending)}</strong>
          <small>Month to date</small>
        </article>
        <article className={`finance-metric flow-metric ${totals.income - totals.spending >= 0 ? 'positive' : 'negative'}`}>
          <span>Cash flow</span>
          <strong>{totals.income - totals.spending >= 0 ? '+' : ''}{money.format(totals.income - totals.spending)}</strong>
          <small>Income minus spending</small>
        </article>
      </div>

      <div className="finance-workspace">
        <section className="finance-panel transaction-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-index">01 / LEDGER</p>
              <h2>Add movement</h2>
            </div>
            <div className="type-switch" role="group" aria-label="Transaction type">
              <button
                type="button"
                className={form.type === 'expense' ? 'selected expense' : ''}
                onClick={() => setForm((current) => ({
                  ...current,
                  type: 'expense',
                  category: expenseCategories.some((category) => category.id === current.category)
                    ? current.category
                    : (expenseCategories[0]?.id || ''),
                }))}
              >
                Expense
              </button>
              <button
                type="button"
                className={form.type === 'income' ? 'selected income' : ''}
                onClick={() => setForm((current) => ({
                  ...current,
                  type: 'income',
                  category: incomeCategories.some((category) => category.id === current.category)
                    ? current.category
                    : (incomeCategories[0]?.id || ''),
                }))}
              >
                Income
              </button>
            </div>
          </div>

          <form className="transaction-form" onSubmit={addTransaction}>
            <label className="amount-field">
              <span>Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                aria-label="Transaction amount"
                required
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {(form.type === 'income' ? incomeCategories : expenseCategories).map((category) => (
                  <option key={category.id} value={category.id}>{category.icon} {category.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Account</span>
              <select value={form.accountId} onChange={(event) => setForm((current) => ({ ...current, accountId: event.target.value }))}>
                {finance.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} />
            </label>
            <label className="note-field">
              <span>Note</span>
              <input type="text" value={form.note} placeholder="What was it?" onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} />
            </label>
            <button className="add-transaction-button" type="submit">Record {form.type}</button>
          </form>
        </section>

        <section className="finance-panel budget-status-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-index">02 / BUDGET</p>
              <h2>Monthly runway</h2>
            </div>
          </div>
          <div className="runway-grid">
            <div className="runway-block">
              <div className="runway-block-head">
                <span>Spending budget</span>
                <span className={`budget-state ${expenseBudgetRemaining < 0 ? 'over' : 'on-track'}`}>
                  {expenseBudgetRemaining < 0 ? 'Over limit' : 'On track'}
                </span>
              </div>
              <div className="runway-content">
                <div className="budget-orbit expense-orbit" style={{ '--budget-progress': `${expenseBudgetProgress}%` }}>
                  <div>
                    <strong>{Math.round(expenseBudgetProgress)}%</strong>
                    <span>used</span>
                  </div>
                </div>
                <div className="runway-values">
                  <div><span>Spent</span><strong>{money.format(totals.spending)}</strong></div>
                  <div><span>Budget</span><strong>{money.format(totals.expenseBudget)}</strong></div>
                  <div><span>Left</span><strong>{money.format(expenseBudgetRemaining)}</strong></div>
                </div>
              </div>
            </div>

            <div className="runway-block">
              <div className="runway-block-head">
                <span>Income goal</span>
                <span className={`budget-state ${totals.incomeGoal > 0 && totals.income < totals.incomeGoal ? 'over' : 'on-track'}`}>
                  {totals.incomeGoal > 0 ? (totals.income >= totals.incomeGoal ? 'Goal reached' : 'Below goal') : 'No goal set'}
                </span>
              </div>
              <div className="runway-content">
                <div className="budget-orbit income-orbit" style={{ '--budget-progress': `${incomeGoalProgress}%` }}>
                  <div>
                    <strong>{Math.round(incomeGoalProgress)}%</strong>
                    <span>earned</span>
                  </div>
                </div>
                <div className="runway-values">
                  <div><span>Earned</span><strong>{money.format(totals.income)}</strong></div>
                  <div><span>Goal</span><strong>{money.format(totals.incomeGoal)}</strong></div>
                  <div><span>{incomeGoalRemaining < 0 ? 'Surplus' : 'Left'}</span><strong>{money.format(Math.abs(incomeGoalRemaining))}</strong></div>
                </div>
              </div>
              {incomeBreakdown.length > 0 && (
                <div className="income-breakdown">
                  <p>What this month's income consists of</p>
                  {incomeBreakdown.map((entry) => (
                    <span key={entry.id} style={{ '--legend-color': entry.color }}>
                      <strong>{entry.label}</strong> — {Math.round(entry.percent)}% ({money.format(entry.amount)})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="budget-note">Set a monthly limit for expenses and a goal for income below to activate these signals.</p>
        </section>
      </div>

      <div className="finance-columns">
        <section className="finance-panel budget-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-index">03 / ALLOCATION</p>
              <h2>Category budgets</h2>
            </div>
            <div className="type-switch" role="group" aria-label="Budget type">
              <button type="button" className={budgetTab === 'expense' ? 'selected expense' : ''} onClick={() => setBudgetTab('expense')}>Expenses</button>
              <button type="button" className={budgetTab === 'income' ? 'selected income' : ''} onClick={() => setBudgetTab('income')}>Income</button>
            </div>
          </div>
          <form className="new-category-form" onSubmit={addCategory}>
            <input
              type="text"
              placeholder={budgetTab === 'income' ? 'New income source' : 'New category'}
              value={newCategory.label}
              onChange={(event) => setNewCategory((current) => ({ ...current, label: event.target.value }))}
              required
            />
            <input
              type="color"
              value={newCategory.color}
              onChange={(event) => setNewCategory((current) => ({ ...current, color: event.target.value }))}
              aria-label="Category color"
            />
            <button type="submit">Add {budgetTab === 'income' ? 'source' : 'category'}</button>
          </form>
          <div className="budget-grid">
            {(budgetTab === 'income' ? incomeCategories : expenseCategories).map((category) => {
              const activity = (budgetTab === 'income' ? incomeByCategory : spendingByCategory)[category.id] || 0;
              const budget = Number(finance.budgets[budgetTab][category.id] || 0);
              const progress = budget > 0 ? Math.min((activity / budget) * 100, 100) : 0;
              const isOverBudget = budgetTab === 'expense' && budget > 0 && activity > budget;
              const isBelowGoal = budgetTab === 'income' && budget > 0 && activity < budget;

              return (
                <article
                  className={`category-budget ${isOverBudget ? 'over-budget' : ''} ${isBelowGoal ? 'below-goal' : ''}`}
                  key={category.id}
                  style={{ '--category-color': category.color }}
                >
                  <div className="category-budget-topline">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.label}</span>
                    <strong>{money.format(activity)}</strong>
                  </div>
                  <div className="category-progress"><span style={{ width: `${progress}%` }} /></div>
                  <label>
                    <span>{budgetTab === 'income' ? 'Goal' : 'Limit'}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={budget || ''}
                      placeholder={budgetTab === 'income' ? 'Set goal' : 'Set budget'}
                      onChange={(event) => updateBudget(budgetTab, category.id, event.target.value)}
                      aria-label={`${category.label} monthly ${budgetTab === 'income' ? 'goal' : 'budget'}`}
                    />
                  </label>
                  <button type="button" className="delete-category" onClick={() => deleteCategory(budgetTab, category.id)} aria-label={`Delete ${category.label}`}>
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="finance-panel accounts-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-index">04 / VAULT</p>
              <h2>Accounts</h2>
            </div>
            <button className="text-action" type="button" onClick={() => setShowAccountForm((visible) => !visible)}>{showAccountForm ? 'Close' : '+ Account'}</button>
          </div>
          {showAccountForm && (
            <form className="new-account-form" onSubmit={addAccount}>
              <input type="text" placeholder="Account name" value={newAccount.name} onChange={(event) => setNewAccount((current) => ({ ...current, name: event.target.value }))} required />
              <input type="number" placeholder="Starting balance" value={newAccount.balance} onChange={(event) => setNewAccount((current) => ({ ...current, balance: event.target.value }))} />
              <button type="submit">Add</button>
            </form>
          )}
          <div className="account-list">
            {finance.accounts.map((account) => (
              <article className="account-row" key={account.id} style={{ '--account-color': account.color }}>
                <span className="account-marker" />
                <div className="account-main">
                  <label className="account-name-label">
                    <span className="visually-hidden">Account name</span>
                    <input
                      type="text"
                      className="account-name-input"
                      value={account.name}
                      onChange={(event) => updateAccountField(account.id, 'name', event.target.value)}
                    />
                  </label>
                  <label className="account-color-picker" style={{ '--account-color': account.color }}>
                    <input
                      type="color"
                      value={account.color}
                      onChange={(event) => updateAccountField(account.id, 'color', event.target.value)}
                      aria-label={`Change color for ${account.name}`}
                    />
                    <span />
                  </label>
                </div>
                <label className="account-balance-label">
                  <span className="visually-hidden">{account.name} balance</span>
                  <input
                    type="number"
                    step="0.01"
                    value={account.balance}
                    onChange={(event) => updateAccountField(account.id, 'balance', event.target.value)}
                  />
                </label>
                <span className="account-currency">{finance.currency}</span>
                <div className="account-actions">
                  <button type="button" className="account-move" onClick={() => moveAccount(account.id, -1)} aria-label={`Move ${account.name} up`}>
                    ▲
                  </button>
                  <button type="button" className="account-move" onClick={() => moveAccount(account.id, 1)} aria-label={`Move ${account.name} down`}>
                    ▼
                  </button>
                </div>
                <button type="button" className="account-delete" onClick={() => deleteAccount(account.id)} aria-label={`Delete ${account.name}`}>
                  ×
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="finance-panel transactions-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-index">05 / HISTORY</p>
            <h2>Recent movements</h2>
          </div>
          <span className="panel-hint">{finance.transactions.length} recorded total</span>
        </div>
        {recentTransactions.length ? (
          <div className="transaction-list">
            {recentTransactions.map((transaction) => {
              const category = categoryFor(transaction.category);
              const account = finance.accounts.find((item) => item.id === transaction.accountId);
              return (
                <article className={`transaction-row ${transaction.type}`} key={transaction.id}>
                  <span className="transaction-category-icon" style={{ '--category-color': category.color }}>{category.icon}</span>
                  <div className="transaction-detail">
                    <strong>{transaction.note}</strong>
                    <span>{category.label} · {account?.name || 'Archived account'} · {transaction.date}</span>
                  </div>
                  <strong className="transaction-amount">{transaction.type === 'income' ? '+' : '-'}{money.format(transaction.amount)}</strong>
                  <button type="button" className="delete-transaction" onClick={() => deleteTransaction(transaction)} aria-label={`Delete ${transaction.note}`}>×</button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="transactions-empty">
            <span>◎</span>
            <p>No movements recorded yet. Add your first expense or income above.</p>
          </div>
        )}
      </section>

      <section className="finance-panel finance-bottom">
        <div className="panel-heading">
          <div>
            <p className="panel-index">06 / ANALYTICS</p>
            <h2>Trend & performance</h2>
          </div>
          <span className="panel-hint">Expenses · Earnings · Total</span>
        </div>
        <div className="analytics-body">
          <div className="analytics-graph-block">
            <div className="analytics-graph-top">
              <strong>Monthly trend</strong>
              <span>Month labels show broader timeline; day ticks are integrated into the grid.</span>
            </div>
            <div className="analytics-graph-frame">
              <svg viewBox="0 0 280 160" preserveAspectRatio="none">
                <g className="grid-lines">
                  <line x1="20" y1="20" x2="260" y2="20" />
                  <line x1="20" y1="52" x2="260" y2="52" />
                  <line x1="20" y1="84" x2="260" y2="84" />
                  <line x1="20" y1="116" x2="260" y2="116" />
                  <line x1="20" y1="148" x2="260" y2="148" />
                </g>
                <path d={analytics.linePaths.spending} className="line spending-line" />
                <path d={analytics.linePaths.income} className="line income-line" />
                <path d={analytics.linePaths.total} className="line total-line" />
                {analytics.monthLabels.map((label, index) => {
                  const x = 26 + index * 42;
                  return <line key={`${label}-${index}`} x1={x} y1="148" x2={x} y2="156" className="axis-tick" />;
                })}
              </svg>
            </div>
            <div className="analytics-axis">
              {analytics.monthLabels.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
          </div>

          <div className="analytics-summary">
            <article className="analytics-summary-card">
              <strong>{Number.isFinite(analytics.ratio) ? `${analytics.ratio.toFixed(2)}x` : analytics.ratio === Infinity ? '∞' : '-'}</strong>
              <span>Ratio of earnings to spendings</span>
            </article>
            <article className="analytics-summary-card">
              <strong>{analytics.formatPercent(analytics.averageBudgetUsage * 100)}</strong>
              <span>Average % used of budget</span>
            </article>
            <article className="analytics-summary-card">
              <strong>{analytics.formatCurrency(analytics.averageGrowth)}</strong>
              <span>Average growth per month</span>
            </article>
            <article className="analytics-summary-card">
              <strong>{analytics.formatCurrency(analytics.biggestIncome)}</strong>
              <span>Biggest earning</span>
            </article>
            <article className="analytics-summary-card">
              <strong>{analytics.formatCurrency(analytics.biggestSpending)}</strong>
              <span>Biggest spending</span>
            </article>
          </div>
        </div>

        <div className="analytics-circles">
          <article className="donut-card spending-donut" style={{ '--fill': `${analytics.spendingShare.toFixed(0)}%` }}>
            <span>Spendings</span>
            <div className="donut-chart">
              <strong>{analytics.formatPercent(analytics.spendingShare)}</strong>
            </div>
            <small>{analytics.formatCurrency(analytics.totalSpending)}</small>
          </article>
          <article className="donut-card income-donut" style={{ '--fill': `${analytics.earningShare.toFixed(0)}%` }}>
            <span>Earnings</span>
            <div className="donut-chart">
              <strong>{analytics.formatPercent(analytics.earningShare)}</strong>
            </div>
            <small>{analytics.formatCurrency(analytics.totalIncome)}</small>
          </article>
          <article className="donut-card asset-donut" style={{ '--asset-background': analytics.assetBackground }}>
            <span>Asset ratio</span>
            <div className="donut-chart asset-chart">
              <strong>{analytics.formatCurrency(analytics.assetTotal)}</strong>
            </div>
            <div className="asset-legend">
              {(analytics.assetLegend || []).slice(0, 3).map((segment) => (
                <span key={segment.id} style={{ '--legend-color': segment.color }}>
                  <strong>{segment.name}</strong> — {Math.round(segment.percent)}% of assets
                </span>
              ))}
              {(analytics.assetLegend || []).length > 3 && <span>+{analytics.assetLegend.length - 3} more</span>}
            </div>
            <small className="asset-legend-note">Accounts with a positive balance only — each line is the account and its share of that total.</small>
          </article>
        </div>
      </section>
    </section>
  );
}
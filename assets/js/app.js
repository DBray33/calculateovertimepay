/**
 * Split Bills Fairly - Calculator Application
 * Pure vanilla JavaScript, no dependencies
 */

(function() {
  'use strict';

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Format a number as currency
   */
  function formatCurrency(amount) {
    return '$' + Math.abs(amount).toFixed(2);
  }

  /**
   * Parse a currency input value to cents (integer)
   */
  function parseToCents(value) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num * 100);
  }

  /**
   * Convert cents to dollars
   */
  function centsToDollars(cents) {
    return cents / 100;
  }

  /**
   * Safely get element by ID
   */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Copy text to clipboard with fallback for older browsers
   */
  function copyToClipboard(text, button) {
    function onSuccess() {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }

    function onError(err) {
      console.error('Failed to copy:', err);
      // Show error feedback
      const originalText = button.textContent;
      button.textContent = 'Failed';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }

    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function() {
        // Fallback to execCommand
        fallbackCopy(text, onSuccess, onError);
      });
    } else {
      // Fallback for older browsers
      fallbackCopy(text, onSuccess, onError);
    }
  }

  /**
   * Fallback copy using execCommand
   */
  function fallbackCopy(text, onSuccess, onError) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        onSuccess();
      } else {
        onError(new Error('execCommand failed'));
      }
    } catch (err) {
      document.body.removeChild(textArea);
      onError(err);
    }
  }

  // ============================================
  // Navigation
  // ============================================

  function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('active');
    });

    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
      });
    });

    // Close menu on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
        toggle.focus();
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (menu.classList.contains('active') && !menu.contains(e.target) && !toggle.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
      }
    });
  }

  // ============================================
  // Tabs
  // ============================================

  function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    if (tabs.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;

        // Update tabs
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update panels
        panels.forEach(panel => {
          panel.classList.remove('active');
          if (panel.id === targetId + '-panel') {
            panel.classList.add('active');
          }
        });
      });

      // Keyboard navigation
      tab.addEventListener('keydown', (e) => {
        const tabsArray = Array.from(tabs);
        const currentIndex = tabsArray.indexOf(tab);
        let newIndex;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          newIndex = (currentIndex + 1) % tabsArray.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          newIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabsArray.length - 1;
        }

        if (newIndex !== undefined) {
          e.preventDefault();
          tabsArray[newIndex].click();
          tabsArray[newIndex].focus();
        }
      });
    });

    // Handle tab target links (from FAQ, How It Works, etc.)
    document.querySelectorAll('[data-tab-target]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetTab = link.dataset.tabTarget;
        const tabButton = document.querySelector(`[data-tab="${targetTab}"]`);
        if (tabButton) {
          // Small delay to allow scroll to complete
          setTimeout(() => tabButton.click(), 100);
        }
      });
    });
  }

  // ============================================
  // Even Bill Split Calculator
  // ============================================

  function initEvenSplitCalculator() {
    const billTotalInput = $('bill-total');
    const numPeopleInput = $('num-people');
    const resultValue = $('even-result-value');
    const resultMeta = $('even-result-meta');
    const copyBtn = $('copy-even-result');
    const resetBtn = $('reset-even-split');
    const billTotalError = $('bill-total-error');
    const numPeopleError = $('num-people-error');

    if (!billTotalInput || !numPeopleInput) return;

    function calculate() {
      // Clear errors
      if (billTotalError) billTotalError.textContent = '';
      if (numPeopleError) numPeopleError.textContent = '';
      billTotalInput.classList.remove('error');
      numPeopleInput.classList.remove('error');

      const billTotal = parseFloat(billTotalInput.value) || 0;
      const numPeople = parseInt(numPeopleInput.value) || 0;

      // Validation
      let hasError = false;

      if (billTotalInput.value && billTotal < 0) {
        if (billTotalError) billTotalError.textContent = 'Please enter a positive amount';
        billTotalInput.classList.add('error');
        hasError = true;
      }

      if (numPeopleInput.value && numPeople < 1) {
        if (numPeopleError) numPeopleError.textContent = 'Please enter at least 1 person';
        numPeopleInput.classList.add('error');
        hasError = true;
      }

      if (hasError || billTotal <= 0 || numPeople < 1) {
        resultValue.textContent = '$0.00';
        if (resultMeta) resultMeta.textContent = '';
        return;
      }

      // Calculate with proper rounding
      const perPersonCents = Math.round((billTotal * 100) / numPeople);
      const perPerson = centsToDollars(perPersonCents);

      resultValue.textContent = formatCurrency(perPerson);

      // Update meta info
      if (resultMeta) {
        resultMeta.textContent = 'Total: ' + formatCurrency(billTotal) + ' / ' + numPeople + ' people';
      }
    }

    function reset() {
      billTotalInput.value = '';
      numPeopleInput.value = '';
      resultValue.textContent = '$0.00';
      if (resultMeta) resultMeta.textContent = '';
      if (billTotalError) billTotalError.textContent = '';
      if (numPeopleError) numPeopleError.textContent = '';
      billTotalInput.classList.remove('error');
      numPeopleInput.classList.remove('error');
    }

    billTotalInput.addEventListener('input', calculate);
    numPeopleInput.addEventListener('input', calculate);

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const billTotal = parseFloat(billTotalInput.value) || 0;
        const numPeople = parseInt(numPeopleInput.value) || 0;
        const perPerson = resultValue.textContent;

        let text = '📊 Even Bill Split\n';
        text += '─────────────────\n';
        text += `Total: ${formatCurrency(billTotal)}\n`;
        text += `People: ${numPeople}\n`;
        text += `Each person pays: ${perPerson}\n`;
        text += '\n📱 Calculate your own split at splitbillsfairly.com';

        copyToClipboard(text, copyBtn);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }

    // Export Even Split PDF
    const exportEvenPdfBtn = $('export-even-pdf');
    if (exportEvenPdfBtn) {
      exportEvenPdfBtn.addEventListener('click', () => {
        const billTotal = parseFloat(billTotalInput.value) || 0;
        const numPeople = parseInt(numPeopleInput.value) || 0;
        const perPerson = resultValue.textContent;

        if (billTotal <= 0 || numPeople < 1) {
          alert('Please enter valid values before exporting.');
          return;
        }

        const today = new Date().toLocaleDateString();

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Even Bill Split - ${today}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 60px; margin: 0; color: #1f2937; }
              h1 { font-size: 24px; margin-bottom: 8px; }
              .date { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
              .summary-box { background: #FFF7ED; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
              .result { font-size: 32px; font-weight: 700; color: #F54900; margin: 16px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .detail-row:last-child { border-bottom: none; }
              .label { color: #6b7280; }
              .value { font-weight: 600; }
              .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
              @media print { body { padding: 20px 40px; } @page { margin: 0.5in; } }
            </style>
          </head>
          <body>
            <h1>Even Bill Split</h1>
            <p class="date">Generated on ${today}</p>

            <div class="summary-box">
              <div class="detail-row">
                <span class="label">Total Bill</span>
                <span class="value">${formatCurrency(billTotal)}</span>
              </div>
              <div class="detail-row">
                <span class="label">Number of People</span>
                <span class="value">${numPeople}</span>
              </div>
              <div style="text-align: center; margin-top: 16px;">
                <div style="font-size: 14px; color: #6b7280;">Each person pays</div>
                <div class="result">${perPerson}</div>
              </div>
            </div>

            <div class="footer">
              Generated by SplitBillsFairly.com
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      });
    }
  }

  // ============================================
  // Fair Split (Scenarios) Calculator
  // ============================================

  function initGroupExpensesCalculator() {
    // DOM Elements
    const scenarioTabs = document.querySelectorAll('.scenario-tab');
    const scenarioPanels = document.querySelectorAll('.scenario-panel');
    const peopleList = $('people-list');
    const addPersonBtn = $('add-person-btn');
    const calculateBtn = $('calculate-fair-split');
    const resetBtn = $('reset-fair-split');
    const resultsEl = $('fair-split-results');
    const summaryTable = $('fair-split-summary');
    const settlementsList = $('fair-split-settlements');

    // Restaurant-specific
    const itemsList = $('items-list');
    const addItemBtn = $('add-item-btn');
    const taxTipToggle = $('tax-tip-toggle');
    const taxTipSection = $('tax-tip-section');
    const taxTipAmount = $('tax-tip-amount');
    const restaurantPayersEl = $('restaurant-payers');

    // Group Expense-specific
    const groupExpenseItemsList = $('group-expense-items-list');
    const addGroupExpenseItemBtn = $('add-group-expense-item-btn');

    // Trip-specific
    const lodgingItemsList = $('lodging-items-list');
    const addLodgingItemBtn = $('add-lodging-item-btn');
    const sharedItemsList = $('shared-items-list');
    const addSharedItemBtn = $('add-shared-item-btn');

    if (!peopleList) return;

    // ============================================
    // State
    // ============================================
    const state = {
      people: [
        { id: 0, name: 'Person 1' },
        { id: 1, name: 'Person 2' }
      ],
      scenario: 'restaurant',
      restaurant: {
        items: [{ id: 0, name: 'Shared appetizer', amount: 0, qty: 1, participants: [0, 1] }],
        taxTipEnabled: false,
        taxTipAmount: 0,
        taxTipMethod: 'proportional',
        payers: { 0: 0 } // personId: amountPaid (0 means they paid the whole thing if only one selected)
      },
      groupExpense: {
        items: [{ id: 0, name: '', amount: 0, qty: 1, participants: [0, 1], payers: { 0: 0 } }]
      },
      trip: {
        lodgingItems: [],
        sharedItems: []
      }
    };

    let nextPersonId = 2;
    let nextItemId = 1;
    let nextGroupExpenseItemId = 1;
    let nextLodgingItemId = 0;
    let nextSharedItemId = 0;

    // ============================================
    // Utility Functions
    // ============================================

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function getPersonName(id) {
      const person = state.people.find(p => p.id === id);
      return person ? person.name : 'Unknown';
    }

    /**
     * Distribute total cents among participants with proper remainder handling.
     * Returns an object mapping participant ID to their share in cents.
     * Ensures that the sum of all shares equals totalCents exactly.
     */
    function distributeCentsEvenly(totalCents, participantIds) {
      if (participantIds.length === 0) return {};

      const baseShare = Math.floor(totalCents / participantIds.length);
      const remainder = totalCents - (baseShare * participantIds.length);

      const shares = {};
      participantIds.forEach((pid, index) => {
        // Give the remainder cents to the first N participants (1 cent each)
        shares[pid] = baseShare + (index < remainder ? 1 : 0);
      });

      return shares;
    }

    // ============================================
    // People Manager
    // ============================================

    function renderPeopleList() {
      peopleList.innerHTML = state.people.map(p => `
        <div class="person-row" data-person-id="${p.id}">
          <input type="text" class="person-name-input" value="${escapeHtml(p.name)}" placeholder="Name" data-person-id="${p.id}">
          <button class="btn-remove-person" aria-label="Remove person" data-person-id="${p.id}">&times;</button>
        </div>
      `).join('');

      // Attach event listeners
      peopleList.querySelectorAll('.person-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.personId);
          const person = state.people.find(p => p.id === id);
          if (person) person.name = e.target.value || 'Unnamed';
          updateAllUI();
        });
      });

      peopleList.querySelectorAll('.btn-remove-person').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.dataset.personId);
          removePerson(id);
        });
      });
    }

    function addPerson() {
      const id = nextPersonId++;
      state.people.push({ id, name: `Person ${state.people.length + 1}` });

      // Add to all existing items
      state.restaurant.items.forEach(item => {
        item.participants.push(id);
      });
      state.groupExpense.items.forEach(item => {
        item.participants.push(id);
      });
      state.trip.lodgingItems.forEach(item => {
        item.participants.push(id);
      });
      state.trip.sharedItems.forEach(item => {
        item.participants.push(id);
      });

      renderPeopleList();
      updateAllUI();
    }

    function removePerson(id) {
      if (state.people.length <= 1) {
        alert('You need at least one person.');
        return;
      }

      state.people = state.people.filter(p => p.id !== id);

      // Remove from all items
      state.restaurant.items.forEach(item => {
        item.participants = item.participants.filter(pid => pid !== id);
      });
      state.groupExpense.items.forEach(item => {
        item.participants = item.participants.filter(pid => pid !== id);
      });
      state.trip.lodgingItems.forEach(item => {
        item.participants = item.participants.filter(pid => pid !== id);
      });
      state.trip.sharedItems.forEach(item => {
        item.participants = item.participants.filter(pid => pid !== id);
      });

      // Update payers if needed
      delete state.restaurant.payers[id];
      state.groupExpense.items.forEach(item => {
        if (item.payers) delete item.payers[id];
      });
      state.trip.lodgingItems.forEach(item => {
        delete item.payers[id];
      });
      state.trip.sharedItems.forEach(item => {
        delete item.payers[id];
      });

      renderPeopleList();
      updateAllUI();
    }

    // ============================================
    // Payer Bubble Groups
    // ============================================

    function renderPayerBubbles(containerId, payersObj, onChangeCallback) {
      const container = $(containerId);
      if (!container) return;

      container.innerHTML = state.people.map(p => {
        const isChecked = payersObj.hasOwnProperty(p.id);
        const amount = payersObj[p.id] || '';
        return `
          <label class="payer-bubble">
            <input type="checkbox" data-person-id="${p.id}" ${isChecked ? 'checked' : ''}>
            <span>${escapeHtml(p.name)}</span>
            <span class="payer-bubble-amount">
              $<input type="number" class="payer-amount-input" min="0" step="0.01" placeholder="0.00" value="${amount || ''}" data-person-id="${p.id}" inputmode="decimal">
            </span>
          </label>
        `;
      }).join('');

      // Attach event listeners
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const personId = parseInt(e.target.dataset.personId);
          if (e.target.checked) {
            payersObj[personId] = 0;
          } else {
            delete payersObj[personId];
          }
          renderPayerBubbles(containerId, payersObj, onChangeCallback);
          if (onChangeCallback) onChangeCallback();
        });
      });

      container.querySelectorAll('.payer-amount-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const personId = parseInt(e.target.dataset.personId);
          payersObj[personId] = parseFloat(e.target.value) || 0;
          if (onChangeCallback) onChangeCallback();
        });

        // Prevent checkbox toggle when clicking input
        input.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });
    }

    // ============================================
    // Restaurant Items
    // ============================================

    function renderRestaurantItems() {
      if (!itemsList) return;

      itemsList.innerHTML = state.restaurant.items.map(item => `
        <div class="item-row" data-item-id="${item.id}">
          <div class="item-details">
            <div class="item-name-wrapper">
              <label class="item-label">Item</label>
              <input type="text" class="item-name-input" placeholder="Item name" value="${escapeHtml(item.name)}" data-item-id="${item.id}">
            </div>
            <div class="qty-wrapper">
              <label class="qty-label">Qty</label>
              <input type="number" class="item-qty-input" min="1" step="1" value="${item.qty || 1}" inputmode="numeric" data-item-id="${item.id}">
            </div>
            <div class="price-wrapper">
              <label class="price-label">Cost</label>
              <input type="number" class="item-amount-input" min="0" step="0.01" placeholder="0.00" inputmode="decimal" value="${item.amount || ''}" data-item-id="${item.id}">
            </div>
            <button class="btn-remove-item" aria-label="Remove item" data-item-id="${item.id}">&times;</button>
          </div>
          <div class="item-participants" data-item-id="${item.id}">
            <span class="participants-label">Split between:</span>
            <div class="checkbox-group" id="item-participants-${item.id}">
              ${state.people.map(p => `
                <label class="checkbox-label">
                  <input type="checkbox" data-item-id="${item.id}" data-person-id="${p.id}" ${item.participants.includes(p.id) ? 'checked' : ''}>
                  <span>${escapeHtml(p.name)}</span>
                </label>
              `).join('')}
            </div>
            <span class="item-error" id="item-error-${item.id}">${item.participants.length === 0 ? 'Select at least one person' : ''}</span>
          </div>
        </div>
      `).join('');

      // Attach event listeners
      itemsList.querySelectorAll('.item-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.restaurant.items.find(i => i.id === id);
          if (item) item.name = e.target.value;
        });
      });

      itemsList.querySelectorAll('.item-qty-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.restaurant.items.find(i => i.id === id);
          if (item) item.qty = Math.max(1, parseInt(e.target.value) || 1);
          updateRestaurantTotals();
        });
      });

      itemsList.querySelectorAll('.item-amount-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.restaurant.items.find(i => i.id === id);
          if (item) item.amount = parseFloat(e.target.value) || 0;
          updateRestaurantTotals();
        });
      });

      itemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          state.restaurant.items = state.restaurant.items.filter(i => i.id !== id);
          renderRestaurantItems();
          updateRestaurantTotals();
        });
      });

      itemsList.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const itemId = parseInt(e.target.dataset.itemId);
          const personId = parseInt(e.target.dataset.personId);
          const item = state.restaurant.items.find(i => i.id === itemId);
          if (!item) return;

          if (e.target.checked) {
            if (!item.participants.includes(personId)) {
              item.participants.push(personId);
            }
          } else {
            item.participants = item.participants.filter(id => id !== personId);
          }

          // Update error message
          const errorEl = $(`item-error-${itemId}`);
          if (errorEl) {
            errorEl.textContent = item.participants.length === 0 ? 'Select at least one person' : '';
          }
          updateRestaurantTotals();
        });
      });
    }

    function addRestaurantItem() {
      const id = nextItemId++;
      state.restaurant.items.push({
        id,
        name: '',
        amount: 0,
        qty: 1,
        participants: state.people.map(p => p.id)
      });
      renderRestaurantItems();
    }

    function updateRestaurantTotals() {
      const subtotal = state.restaurant.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.qty || 1)), 0);
      const taxTip = state.restaurant.taxTipEnabled ? (state.restaurant.taxTipAmount || 0) : 0;
      const grandTotal = subtotal + taxTip;

      const subtotalEl = $('restaurant-subtotal');
      const taxTipEl = $('restaurant-taxtip');
      const grandTotalEl = $('restaurant-grand-total');
      const taxTipRow = $('tax-tip-row');

      if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
      if (taxTipEl) taxTipEl.textContent = formatCurrency(taxTip);
      if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
      if (taxTipRow) taxTipRow.style.display = state.restaurant.taxTipEnabled ? '' : 'none';
    }

    // ============================================
    // Group Expense Items
    // ============================================

    function renderGroupExpenseItems() {
      if (!groupExpenseItemsList) return;

      groupExpenseItemsList.innerHTML = state.groupExpense.items.map(item => `
        <div class="item-row" data-item-id="${item.id}">
          <div class="item-details">
            <div class="item-name-wrapper">
              <label class="item-label">Item</label>
              <input type="text" class="group-expense-item-name-input" placeholder="Expense name" value="${escapeHtml(item.name)}" data-item-id="${item.id}">
            </div>
            <div class="qty-wrapper">
              <label class="qty-label">Qty</label>
              <input type="number" class="group-expense-item-qty-input" min="1" step="1" value="${item.qty || 1}" inputmode="numeric" data-item-id="${item.id}">
            </div>
            <div class="price-wrapper">
              <label class="price-label">Cost</label>
              <input type="number" class="group-expense-item-amount-input" min="0" step="0.01" placeholder="0.00" inputmode="decimal" value="${item.amount || ''}" data-item-id="${item.id}">
            </div>
            <button class="btn-remove-item" aria-label="Remove item" data-item-id="${item.id}">&times;</button>
          </div>
          <div class="item-participants" data-item-id="${item.id}">
            <span class="participants-label">Split between:</span>
            <div class="checkbox-group" id="group-expense-item-participants-${item.id}">
              ${state.people.map(p => `
                <label class="checkbox-label">
                  <input type="checkbox" data-item-id="${item.id}" data-person-id="${p.id}" ${item.participants.includes(p.id) ? 'checked' : ''}>
                  <span>${escapeHtml(p.name)}</span>
                </label>
              `).join('')}
            </div>
            <span class="item-error" id="group-expense-item-error-${item.id}">${item.participants.length === 0 ? 'Select at least one person' : ''}</span>
          </div>
          <div class="item-payers" data-item-id="${item.id}">
            <span class="participants-label">Paid by:</span>
            <div class="payer-bubble-group" id="group-expense-payers-${item.id}"></div>
          </div>
        </div>
      `).join('');

      // Attach event listeners
      groupExpenseItemsList.querySelectorAll('.group-expense-item-name-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.groupExpense.items.find(i => i.id === id);
          if (item) item.name = e.target.value;
        });
      });

      groupExpenseItemsList.querySelectorAll('.group-expense-item-qty-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.groupExpense.items.find(i => i.id === id);
          if (item) item.qty = Math.max(1, parseInt(e.target.value) || 1);
          updateGroupExpenseTotals();
        });
      });

      groupExpenseItemsList.querySelectorAll('.group-expense-item-amount-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.groupExpense.items.find(i => i.id === id);
          if (item) item.amount = parseFloat(e.target.value) || 0;
          updateGroupExpenseTotals();
        });
      });

      groupExpenseItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          state.groupExpense.items = state.groupExpense.items.filter(i => i.id !== id);
          renderGroupExpenseItems();
          updateGroupExpenseTotals();
        });
      });

      groupExpenseItemsList.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const itemId = parseInt(e.target.dataset.itemId);
          const personId = parseInt(e.target.dataset.personId);
          const item = state.groupExpense.items.find(i => i.id === itemId);
          if (!item) return;

          if (e.target.checked) {
            if (!item.participants.includes(personId)) {
              item.participants.push(personId);
            }
          } else {
            item.participants = item.participants.filter(id => id !== personId);
          }

          // Update error message
          const errorEl = $(`group-expense-item-error-${itemId}`);
          if (errorEl) {
            errorEl.textContent = item.participants.length === 0 ? 'Select at least one person' : '';
          }
          updateGroupExpenseTotals();
        });
      });

      // Render payer bubbles for each group expense item
      state.groupExpense.items.forEach(item => {
        renderItemPayerBubbles(`group-expense-payers-${item.id}`, item.payers, updateGroupExpenseTotals);
      });
    }

    function addGroupExpenseItem() {
      const id = nextGroupExpenseItemId++;
      const firstPersonId = state.people[0]?.id || 0;
      state.groupExpense.items.push({
        id,
        name: '',
        amount: 0,
        qty: 1,
        participants: state.people.map(p => p.id),
        payers: { [firstPersonId]: 0 }
      });
      renderGroupExpenseItems();
    }

    function updateGroupExpenseTotals() {
      const grandTotal = state.groupExpense.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.qty || 1)), 0);
      const grandTotalEl = $('group-expense-grand-total');
      if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
    }

    // ============================================
    // Trip: Lodging Items
    // ============================================

    function renderLodgingItems() {
      if (!lodgingItemsList) return;

      if (state.trip.lodgingItems.length === 0) {
        lodgingItemsList.innerHTML = '<p class="empty-hint">No lodging expenses added yet.</p>';
        return;
      }

      lodgingItemsList.innerHTML = state.trip.lodgingItems.map(item => `
        <div class="item-row" data-item-id="${item.id}">
          <div class="item-details">
            <input type="text" class="lodging-item-name" placeholder="Lodging name (e.g., Airbnb)" value="${escapeHtml(item.name)}" data-item-id="${item.id}">
            <input type="number" class="lodging-item-amount" min="0" step="0.01" placeholder="0.00" inputmode="decimal" value="${item.amount || ''}" data-item-id="${item.id}">
            <button class="btn-remove-item" aria-label="Remove lodging" data-item-id="${item.id}">&times;</button>
          </div>
          <div class="item-participants" data-item-id="${item.id}">
            <span class="participants-label">Split between:</span>
            <div class="checkbox-group">
              ${state.people.map(p => `
                <label class="checkbox-label">
                  <input type="checkbox" class="lodging-participant-cb" data-item-id="${item.id}" data-person-id="${p.id}" ${item.participants.includes(p.id) ? 'checked' : ''}>
                  <span>${escapeHtml(p.name)}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="item-payers" data-item-id="${item.id}">
            <span class="participants-label">Paid by:</span>
            <div class="payer-bubble-group" id="lodging-payers-${item.id}"></div>
          </div>
        </div>
      `).join('');

      // Attach event listeners
      lodgingItemsList.querySelectorAll('.lodging-item-name').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.trip.lodgingItems.find(i => i.id === id);
          if (item) item.name = e.target.value;
        });
      });

      lodgingItemsList.querySelectorAll('.lodging-item-amount').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.trip.lodgingItems.find(i => i.id === id);
          if (item) item.amount = parseFloat(e.target.value) || 0;
          updateTripTotals();
        });
      });

      lodgingItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          state.trip.lodgingItems = state.trip.lodgingItems.filter(i => i.id !== id);
          renderLodgingItems();
          updateTripTotals();
        });
      });

      lodgingItemsList.querySelectorAll('.lodging-participant-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const itemId = parseInt(e.target.dataset.itemId);
          const personId = parseInt(e.target.dataset.personId);
          const item = state.trip.lodgingItems.find(i => i.id === itemId);
          if (!item) return;

          if (e.target.checked) {
            if (!item.participants.includes(personId)) {
              item.participants.push(personId);
            }
          } else {
            item.participants = item.participants.filter(id => id !== personId);
          }
          updateTripTotals();
        });
      });

      // Render payer bubbles for each lodging item
      state.trip.lodgingItems.forEach(item => {
        renderItemPayerBubbles(`lodging-payers-${item.id}`, item.payers, updateTripTotals);
      });
    }

    function addLodgingItem() {
      const id = nextLodgingItemId++;
      const firstPersonId = state.people[0]?.id || 0;
      state.trip.lodgingItems.push({
        id,
        name: '',
        amount: 0,
        participants: state.people.map(p => p.id),
        payers: { [firstPersonId]: 0 }
      });
      renderLodgingItems();
    }

    // ============================================
    // Trip: Shared Items
    // ============================================

    function renderSharedItems() {
      if (!sharedItemsList) return;

      if (state.trip.sharedItems.length === 0) {
        sharedItemsList.innerHTML = '<p class="empty-hint">No shared expenses added yet.</p>';
        return;
      }

      sharedItemsList.innerHTML = state.trip.sharedItems.map(item => `
        <div class="item-row" data-item-id="${item.id}">
          <div class="item-details">
            <input type="text" class="shared-item-name" placeholder="Expense name" value="${escapeHtml(item.name)}" data-item-id="${item.id}">
            <input type="number" class="shared-item-amount" min="0" step="0.01" placeholder="0.00" inputmode="decimal" value="${item.amount || ''}" data-item-id="${item.id}">
            <button class="btn-remove-item" aria-label="Remove expense" data-item-id="${item.id}">&times;</button>
          </div>
          <div class="item-participants" data-item-id="${item.id}">
            <span class="participants-label">Split between:</span>
            <div class="checkbox-group">
              ${state.people.map(p => `
                <label class="checkbox-label">
                  <input type="checkbox" class="shared-participant-cb" data-item-id="${item.id}" data-person-id="${p.id}" ${item.participants.includes(p.id) ? 'checked' : ''}>
                  <span>${escapeHtml(p.name)}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="item-payers" data-item-id="${item.id}">
            <span class="participants-label">Paid by:</span>
            <div class="payer-bubble-group" id="shared-payers-${item.id}"></div>
          </div>
        </div>
      `).join('');

      // Attach event listeners
      sharedItemsList.querySelectorAll('.shared-item-name').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.trip.sharedItems.find(i => i.id === id);
          if (item) item.name = e.target.value;
        });
      });

      sharedItemsList.querySelectorAll('.shared-item-amount').forEach(input => {
        input.addEventListener('input', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          const item = state.trip.sharedItems.find(i => i.id === id);
          if (item) item.amount = parseFloat(e.target.value) || 0;
          updateTripTotals();
        });
      });

      sharedItemsList.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.target.dataset.itemId);
          state.trip.sharedItems = state.trip.sharedItems.filter(i => i.id !== id);
          renderSharedItems();
          updateTripTotals();
        });
      });

      sharedItemsList.querySelectorAll('.shared-participant-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const itemId = parseInt(e.target.dataset.itemId);
          const personId = parseInt(e.target.dataset.personId);
          const item = state.trip.sharedItems.find(i => i.id === itemId);
          if (!item) return;

          if (e.target.checked) {
            if (!item.participants.includes(personId)) {
              item.participants.push(personId);
            }
          } else {
            item.participants = item.participants.filter(id => id !== personId);
          }
          updateTripTotals();
        });
      });

      // Render payer bubbles for each shared item
      state.trip.sharedItems.forEach(item => {
        renderItemPayerBubbles(`shared-payers-${item.id}`, item.payers, updateTripTotals);
      });
    }

    function renderItemPayerBubbles(containerId, payersObj, onChangeCallback) {
      const container = $(containerId);
      if (!container) return;

      container.innerHTML = state.people.map(p => {
        const isChecked = payersObj.hasOwnProperty(p.id);
        const amount = payersObj[p.id] || '';
        return `
          <label class="payer-bubble">
            <input type="checkbox" data-person-id="${p.id}" ${isChecked ? 'checked' : ''}>
            <span>${escapeHtml(p.name)}</span>
            <span class="payer-bubble-amount">
              $<input type="number" class="payer-amount-input" min="0" step="0.01" placeholder="0.00" value="${amount || ''}" data-person-id="${p.id}" inputmode="decimal">
            </span>
          </label>
        `;
      }).join('');

      // Attach event listeners
      container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const personId = parseInt(e.target.dataset.personId);
          if (e.target.checked) {
            payersObj[personId] = 0;
          } else {
            delete payersObj[personId];
          }
          renderItemPayerBubbles(containerId, payersObj, onChangeCallback);
          if (onChangeCallback) onChangeCallback();
        });
      });

      container.querySelectorAll('.payer-amount-input').forEach(input => {
        input.addEventListener('input', (e) => {
          const personId = parseInt(e.target.dataset.personId);
          payersObj[personId] = parseFloat(e.target.value) || 0;
          if (onChangeCallback) onChangeCallback();
        });

        // Prevent checkbox toggle when clicking input
        input.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      });
    }

    function addSharedItem() {
      const id = nextSharedItemId++;
      const firstPersonId = state.people[0]?.id || 0;
      state.trip.sharedItems.push({
        id,
        name: '',
        amount: 0,
        participants: state.people.map(p => p.id),
        payers: { [firstPersonId]: 0 }
      });
      renderSharedItems();
    }

    function updateTripTotals() {
      const lodgingTotal = state.trip.lodgingItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const sharedTotal = state.trip.sharedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const grandTotal = lodgingTotal + sharedTotal;

      const lodgingEl = $('trip-lodging-total');
      const sharedEl = $('trip-shared-total');
      const grandTotalEl = $('trip-grand-total');

      if (lodgingEl) lodgingEl.textContent = formatCurrency(lodgingTotal);
      if (sharedEl) sharedEl.textContent = formatCurrency(sharedTotal);
      if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
    }

    // ============================================
    // Calculation Functions
    // ============================================

    function computeRestaurantOwed() {
      const owedCents = {};
      state.people.forEach(p => owedCents[p.id] = 0);

      // Calculate subtotals per person from items
      state.restaurant.items.forEach(item => {
        if (item.participants.length === 0 || !item.amount) return;
        const totalItemCents = Math.round(item.amount * (item.qty || 1) * 100);
        const shares = distributeCentsEvenly(totalItemCents, item.participants);
        Object.entries(shares).forEach(([pid, share]) => {
          owedCents[parseInt(pid)] = (owedCents[parseInt(pid)] || 0) + share;
        });
      });

      // Calculate tax/tip
      if (state.restaurant.taxTipEnabled && state.restaurant.taxTipAmount > 0) {
        const taxTipCents = Math.round(state.restaurant.taxTipAmount * 100);

        if (state.restaurant.taxTipMethod === 'equal') {
          const peopleIds = state.people.map(p => p.id);
          const taxShares = distributeCentsEvenly(taxTipCents, peopleIds);
          Object.entries(taxShares).forEach(([pid, share]) => {
            owedCents[parseInt(pid)] += share;
          });
        } else {
          // Proportional to subtotal
          const totalSubtotalCents = Object.values(owedCents).reduce((a, b) => a + b, 0);
          if (totalSubtotalCents > 0) {
            // Calculate proportional shares and track remainder
            let remainingTaxTip = taxTipCents;
            const proportionalShares = state.people.map(p => {
              const proportion = owedCents[p.id] / totalSubtotalCents;
              const share = Math.floor(taxTipCents * proportion);
              remainingTaxTip -= share;
              return { id: p.id, share, proportion };
            });

            // Sort by proportion descending to give remainder to those with highest proportion
            proportionalShares.sort((a, b) => b.proportion - a.proportion);

            // Distribute remainder
            proportionalShares.forEach((ps, index) => {
              const extraCent = index < remainingTaxTip ? 1 : 0;
              owedCents[ps.id] += ps.share + extraCent;
            });
          }
        }
      }

      return owedCents;
    }

    function computeGroupExpenseOwed() {
      const owedCents = {};
      state.people.forEach(p => owedCents[p.id] = 0);

      // Calculate subtotals per person from items
      state.groupExpense.items.forEach(item => {
        if (item.participants.length === 0 || !item.amount) return;
        const totalItemCents = Math.round(item.amount * (item.qty || 1) * 100);
        const shares = distributeCentsEvenly(totalItemCents, item.participants);
        Object.entries(shares).forEach(([pid, share]) => {
          owedCents[parseInt(pid)] = (owedCents[parseInt(pid)] || 0) + share;
        });
      });

      return owedCents;
    }

    function computeTripOwed() {
      const owedCents = {};
      state.people.forEach(p => owedCents[p.id] = 0);

      // Lodging items
      state.trip.lodgingItems.forEach(item => {
        if (item.participants.length === 0 || !item.amount) return;
        const totalCents = Math.round(item.amount * 100);
        const shares = distributeCentsEvenly(totalCents, item.participants);
        Object.entries(shares).forEach(([pid, share]) => {
          owedCents[parseInt(pid)] = (owedCents[parseInt(pid)] || 0) + share;
        });
      });

      // Shared items
      state.trip.sharedItems.forEach(item => {
        if (item.participants.length === 0 || !item.amount) return;
        const totalCents = Math.round(item.amount * 100);
        const shares = distributeCentsEvenly(totalCents, item.participants);
        Object.entries(shares).forEach(([pid, share]) => {
          owedCents[parseInt(pid)] = (owedCents[parseInt(pid)] || 0) + share;
        });
      });

      return owedCents;
    }

    function computePaid() {
      const paidCents = {};
      state.people.forEach(p => paidCents[p.id] = 0);

      if (state.scenario === 'restaurant') {
        const subtotalCents = state.restaurant.items.reduce((sum, item) =>
          sum + Math.round((item.amount || 0) * (item.qty || 1) * 100), 0);
        const taxTipCents = state.restaurant.taxTipEnabled ?
          Math.round((state.restaurant.taxTipAmount || 0) * 100) : 0;
        const totalCents = subtotalCents + taxTipCents;

        // Distribute payment among payers
        const payerIds = Object.keys(state.restaurant.payers).map(Number);
        if (payerIds.length === 0) return paidCents;

        // Check if specific amounts are entered
        const totalSpecified = Object.values(state.restaurant.payers).reduce((a, b) => a + (b || 0), 0);
        if (totalSpecified > 0) {
          // Use specified amounts
          payerIds.forEach(pid => {
            paidCents[pid] = Math.round((state.restaurant.payers[pid] || 0) * 100);
          });
        } else {
          // Split evenly among selected payers
          const shares = distributeCentsEvenly(totalCents, payerIds);
          Object.entries(shares).forEach(([pid, share]) => {
            paidCents[parseInt(pid)] = share;
          });
        }
      } else if (state.scenario === 'group-expense') {
        // Group expense - each item has its own payers
        state.groupExpense.items.forEach(item => {
          const totalCents = Math.round((item.amount || 0) * (item.qty || 1) * 100);
          const payerIds = Object.keys(item.payers || {}).map(Number);
          if (payerIds.length === 0 || totalCents === 0) return;

          const totalSpecified = Object.values(item.payers || {}).reduce((a, b) => a + (b || 0), 0);
          if (totalSpecified > 0) {
            payerIds.forEach(pid => {
              paidCents[pid] = (paidCents[pid] || 0) + Math.round((item.payers[pid] || 0) * 100);
            });
          } else {
            const shares = distributeCentsEvenly(totalCents, payerIds);
            Object.entries(shares).forEach(([pid, share]) => {
              paidCents[parseInt(pid)] = (paidCents[parseInt(pid)] || 0) + share;
            });
          }
        });
      } else {
        // Trip - each item has its own payers
        state.trip.lodgingItems.forEach(item => {
          const totalCents = Math.round((item.amount || 0) * 100);
          const payerIds = Object.keys(item.payers).map(Number);
          if (payerIds.length === 0 || totalCents === 0) return;

          const totalSpecified = Object.values(item.payers).reduce((a, b) => a + (b || 0), 0);
          if (totalSpecified > 0) {
            payerIds.forEach(pid => {
              paidCents[pid] = (paidCents[pid] || 0) + Math.round((item.payers[pid] || 0) * 100);
            });
          } else {
            const shares = distributeCentsEvenly(totalCents, payerIds);
            Object.entries(shares).forEach(([pid, share]) => {
              paidCents[parseInt(pid)] = (paidCents[parseInt(pid)] || 0) + share;
            });
          }
        });

        state.trip.sharedItems.forEach(item => {
          const totalCents = Math.round((item.amount || 0) * 100);
          const payerIds = Object.keys(item.payers).map(Number);
          if (payerIds.length === 0 || totalCents === 0) return;

          const totalSpecified = Object.values(item.payers).reduce((a, b) => a + (b || 0), 0);
          if (totalSpecified > 0) {
            payerIds.forEach(pid => {
              paidCents[pid] = (paidCents[pid] || 0) + Math.round((item.payers[pid] || 0) * 100);
            });
          } else {
            const shares = distributeCentsEvenly(totalCents, payerIds);
            Object.entries(shares).forEach(([pid, share]) => {
              paidCents[parseInt(pid)] = (paidCents[parseInt(pid)] || 0) + share;
            });
          }
        });
      }

      return paidCents;
    }

    function computeSettlement(owedCents, paidCents) {
      const people = state.people.map(p => {
        const owed = owedCents[p.id] || 0;
        const paid = paidCents[p.id] || 0;
        return {
          id: p.id,
          name: p.name,
          owedCents: owed,
          paidCents: paid,
          netCents: paid - owed
        };
      });

      // Handle rounding errors
      const sumNets = people.reduce((sum, p) => sum + p.netCents, 0);
      if (sumNets !== 0) {
        const sorted = [...people].sort((a, b) => Math.abs(b.netCents) - Math.abs(a.netCents));
        sorted[0].netCents -= sumNets;
      }

      // Greedy settlement algorithm
      const settlements = [];
      const creditors = [];
      const debtors = [];

      people.forEach(p => {
        if (p.netCents > 0) {
          creditors.push({ name: p.name, amountCents: p.netCents });
        } else if (p.netCents < 0) {
          debtors.push({ name: p.name, amountCents: Math.abs(p.netCents) });
        }
      });

      creditors.sort((a, b) => b.amountCents - a.amountCents);
      debtors.sort((a, b) => b.amountCents - a.amountCents);

      while (debtors.length > 0 && creditors.length > 0) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        const paymentCents = Math.min(debtor.amountCents, creditor.amountCents);

        if (paymentCents > 0) {
          settlements.push({
            from: debtor.name,
            to: creditor.name,
            amountCents: paymentCents
          });
        }

        debtor.amountCents -= paymentCents;
        creditor.amountCents -= paymentCents;

        if (debtor.amountCents === 0) debtors.shift();
        if (creditor.amountCents === 0) creditors.shift();
      }

      return { people, settlements };
    }

    // ============================================
    // Calculate & Render Results
    // ============================================

    function calculate() {
      let owedCents;
      if (state.scenario === 'restaurant') {
        owedCents = computeRestaurantOwed();
      } else if (state.scenario === 'group-expense') {
        owedCents = computeGroupExpenseOwed();
      } else {
        owedCents = computeTripOwed();
      }

      const paidCents = computePaid();
      const { people, settlements } = computeSettlement(owedCents, paidCents);

      const totalOwed = Object.values(owedCents).reduce((a, b) => a + b, 0);
      if (totalOwed === 0) {
        resultsEl.classList.remove('active');
        return;
      }

      // Render summary table
      const tbody = summaryTable.querySelector('tbody');
      tbody.innerHTML = people.map(p => {
        const netClass = p.netCents > 0 ? 'net-positive' : (p.netCents < 0 ? 'net-negative' : '');
        const netPrefix = p.netCents > 0 ? '+' : (p.netCents < 0 ? '-' : '');
        return `
          <tr>
            <td>${escapeHtml(p.name)}</td>
            <td>${formatCurrency(centsToDollars(p.owedCents))}</td>
            <td>${formatCurrency(centsToDollars(p.paidCents))}</td>
            <td class="${netClass}">${netPrefix}${formatCurrency(centsToDollars(Math.abs(p.netCents)))}</td>
          </tr>
        `;
      }).join('');

      // Render settlements
      if (settlements.length === 0) {
        settlementsList.innerHTML = '<li>Everyone is already settled up!</li>';
      } else {
        settlementsList.innerHTML = settlements.map(s =>
          `<li><strong>${escapeHtml(s.from)}</strong> owes <span class="settlement-amount">${formatCurrency(centsToDollars(s.amountCents))}</span> to <strong>${escapeHtml(s.to)}</strong></li>`
        ).join('');
      }

      resultsEl.classList.add('active');
    }

    // ============================================
    // Reset Function
    // ============================================

    function resetFairSplit() {
      // Reset people
      state.people = [
        { id: 0, name: 'Person 1' },
        { id: 1, name: 'Person 2' }
      ];
      nextPersonId = 2;

      // Reset restaurant
      state.restaurant = {
        items: [{ id: 0, name: 'Shared appetizer', amount: 0, qty: 1, participants: [0, 1] }],
        taxTipEnabled: false,
        taxTipAmount: 0,
        taxTipMethod: 'proportional',
        payers: { 0: 0 }
      };
      nextItemId = 1;

      // Reset group expense
      state.groupExpense = {
        items: [{ id: 0, name: '', amount: 0, qty: 1, participants: [0, 1], payers: { 0: 0 } }]
      };
      nextGroupExpenseItemId = 1;

      // Reset trip
      state.trip = {
        lodgingItems: [],
        sharedItems: []
      };
      nextLodgingItemId = 0;
      nextSharedItemId = 0;

      // Reset UI elements
      if (taxTipToggle) {
        taxTipToggle.checked = false;
      }
      if (taxTipSection) {
        taxTipSection.classList.add('hidden');
      }
      if (taxTipAmount) {
        taxTipAmount.value = '';
      }

      // Reset radio buttons
      const proportionalRadio = document.querySelector('input[name="tax-tip-method"][value="proportional"]');
      if (proportionalRadio) {
        proportionalRadio.checked = true;
      }

      // Hide results
      resultsEl.classList.remove('active');

      // Re-render everything
      renderPeopleList();
      updateAllUI();
    }

    // ============================================
    // Scenario Switching
    // ============================================

    function switchScenario(scenario) {
      state.scenario = scenario;

      scenarioTabs.forEach(tab => {
        const isActive = tab.dataset.scenario === scenario;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
      });

      scenarioPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `scenario-${scenario}`);
      });

      resultsEl.classList.remove('active');
    }

    // ============================================
    // Update All UI
    // ============================================

    function updateAllUI() {
      renderPayerBubbles('restaurant-payers', state.restaurant.payers, updateRestaurantTotals);
      renderRestaurantItems();
      renderGroupExpenseItems();
      renderLodgingItems();
      renderSharedItems();
      updateRestaurantTotals();
      updateGroupExpenseTotals();
      updateTripTotals();
    }

    // ============================================
    // Event Listeners
    // ============================================

    // Scenario tabs
    scenarioTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchScenario(tab.dataset.scenario);
      });
    });

    // People manager
    if (addPersonBtn) {
      addPersonBtn.addEventListener('click', addPerson);
    }

    // Restaurant
    if (addItemBtn) {
      addItemBtn.addEventListener('click', addRestaurantItem);
    }

    if (taxTipToggle) {
      taxTipToggle.addEventListener('change', () => {
        state.restaurant.taxTipEnabled = taxTipToggle.checked;
        taxTipSection.classList.toggle('hidden', !taxTipToggle.checked);
        updateRestaurantTotals();
      });
    }

    if (taxTipAmount) {
      taxTipAmount.addEventListener('input', () => {
        state.restaurant.taxTipAmount = parseFloat(taxTipAmount.value) || 0;
        updateRestaurantTotals();
      });
    }

    document.querySelectorAll('input[name="tax-tip-method"]').forEach(radio => {
      radio.addEventListener('change', () => {
        state.restaurant.taxTipMethod = radio.value;
      });
    });

    // Group Expense
    if (addGroupExpenseItemBtn) {
      addGroupExpenseItemBtn.addEventListener('click', addGroupExpenseItem);
    }

    // Trip
    if (addLodgingItemBtn) {
      addLodgingItemBtn.addEventListener('click', addLodgingItem);
    }

    if (addSharedItemBtn) {
      addSharedItemBtn.addEventListener('click', addSharedItem);
    }

    // Calculate button
    if (calculateBtn) {
      calculateBtn.addEventListener('click', calculate);
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFairSplit);
    }

    // Copy fair split result button
    const copyFairSplitBtn = $('copy-fair-split-result');
    if (copyFairSplitBtn) {
      copyFairSplitBtn.addEventListener('click', () => {
        // Generate text summary from current results
        const summaryRows = summaryTable.querySelectorAll('tbody tr');
        const settlementItems = settlementsList.querySelectorAll('li');

        let text = '📊 Bill Split Summary\n';
        text += '─────────────────\n';

        // Add summary
        summaryRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const name = cells[0].textContent;
            const owed = cells[1].textContent;
            const paid = cells[2].textContent;
            const net = cells[3].textContent;
            text += `${name}: Owes ${owed}, Paid ${paid}, Net ${net}\n`;
          }
        });

        text += '\n💸 Settlement Plan\n';
        text += '─────────────────\n';

        // Add settlements
        settlementItems.forEach(item => {
          // Extract text content without HTML
          const itemText = item.textContent.trim();
          text += `• ${itemText}\n`;
        });

        text += '\n📱 Calculate your own split at splitbillsfairly.com';

        copyToClipboard(text, copyFairSplitBtn);
      });
    }

    // Export Fair Split PDF
    const exportFairSplitPdfBtn = $('export-fair-split-pdf');
    if (exportFairSplitPdfBtn) {
      exportFairSplitPdfBtn.addEventListener('click', () => {
        if (!resultsEl.classList.contains('active')) {
          alert('Please calculate the settlement first before exporting.');
          return;
        }

        const today = new Date().toLocaleDateString();
        const scenarioNames = {
          'restaurant': 'Restaurant Bill',
          'group-expense': 'Group Expense',
          'trip': 'Trip / Vacation'
        };
        const scenarioName = scenarioNames[state.scenario] || 'Bill Split';

        // Build people list
        const peopleNames = state.people.map(p => p.name).join(', ');

        // Build expenses HTML based on scenario
        let expensesHtml = '';

        if (state.scenario === 'restaurant') {
          state.restaurant.items.forEach(item => {
            if (!item.amount) return;
            const participants = item.participants.map(pid => getPersonName(pid)).join(', ');
            const payerIds = Object.keys(state.restaurant.payers).map(Number);
            const payers = payerIds.map(pid => getPersonName(pid)).join(', ') || 'Not specified';

            expensesHtml += `
              <div class="expense-item">
                <div class="expense-header">
                  <span class="expense-name">${escapeHtml(item.name) || 'Item'}</span>
                  <span class="expense-amount">${formatCurrency(item.amount * (item.qty || 1))}</span>
                </div>
                <div class="expense-details">
                  <div><span class="label">Qty:</span> ${item.qty || 1}</div>
                  <div><span class="label">Split between:</span> ${participants || 'None'}</div>
                </div>
              </div>
            `;
          });

          // Add payer info
          const payerIds = Object.keys(state.restaurant.payers).map(Number);
          const payers = payerIds.map(pid => {
            const amount = state.restaurant.payers[pid];
            return amount > 0 ? `${getPersonName(pid)} (${formatCurrency(amount)})` : getPersonName(pid);
          }).join(', ') || 'Not specified';
          expensesHtml += `<div class="payer-summary"><span class="label">Paid by:</span> ${payers}</div>`;

          if (state.restaurant.taxTipEnabled && state.restaurant.taxTipAmount > 0) {
            expensesHtml += `<div class="payer-summary"><span class="label">Tax + Tip:</span> ${formatCurrency(state.restaurant.taxTipAmount)}</div>`;
          }

        } else if (state.scenario === 'group-expense') {
          state.groupExpense.items.forEach(item => {
            if (!item.amount) return;
            const participants = item.participants.map(pid => getPersonName(pid)).join(', ');
            const payerIds = Object.keys(item.payers || {}).map(Number);
            const payers = payerIds.map(pid => {
              const amount = item.payers[pid];
              return amount > 0 ? `${getPersonName(pid)} (${formatCurrency(amount)})` : getPersonName(pid);
            }).join(', ') || 'Not specified';

            expensesHtml += `
              <div class="expense-item">
                <div class="expense-header">
                  <span class="expense-name">${escapeHtml(item.name) || 'Expense'}</span>
                  <span class="expense-amount">${formatCurrency(item.amount * (item.qty || 1))}</span>
                </div>
                <div class="expense-details">
                  <div><span class="label">Qty:</span> ${item.qty || 1}</div>
                  <div><span class="label">Split between:</span> ${participants || 'None'}</div>
                  <div><span class="label">Paid by:</span> ${payers}</div>
                </div>
              </div>
            `;
          });

        } else if (state.scenario === 'trip') {
          if (state.trip.lodgingItems.length > 0) {
            expensesHtml += '<h3 class="section-title">Lodging</h3>';
            state.trip.lodgingItems.forEach(item => {
              if (!item.amount) return;
              const participants = item.participants.map(pid => getPersonName(pid)).join(', ');
              const payerIds = Object.keys(item.payers || {}).map(Number);
              const payers = payerIds.map(pid => {
                const amount = item.payers[pid];
                return amount > 0 ? `${getPersonName(pid)} (${formatCurrency(amount)})` : getPersonName(pid);
              }).join(', ') || 'Not specified';

              expensesHtml += `
                <div class="expense-item">
                  <div class="expense-header">
                    <span class="expense-name">${escapeHtml(item.name) || 'Lodging'}</span>
                    <span class="expense-amount">${formatCurrency(item.amount)}</span>
                  </div>
                  <div class="expense-details">
                    <div><span class="label">Split between:</span> ${participants || 'None'}</div>
                    <div><span class="label">Paid by:</span> ${payers}</div>
                  </div>
                </div>
              `;
            });
          }

          if (state.trip.sharedItems.length > 0) {
            expensesHtml += '<h3 class="section-title">Shared Expenses</h3>';
            state.trip.sharedItems.forEach(item => {
              if (!item.amount) return;
              const participants = item.participants.map(pid => getPersonName(pid)).join(', ');
              const payerIds = Object.keys(item.payers || {}).map(Number);
              const payers = payerIds.map(pid => {
                const amount = item.payers[pid];
                return amount > 0 ? `${getPersonName(pid)} (${formatCurrency(amount)})` : getPersonName(pid);
              }).join(', ') || 'Not specified';

              expensesHtml += `
                <div class="expense-item">
                  <div class="expense-header">
                    <span class="expense-name">${escapeHtml(item.name) || 'Expense'}</span>
                    <span class="expense-amount">${formatCurrency(item.amount)}</span>
                  </div>
                  <div class="expense-details">
                    <div><span class="label">Split between:</span> ${participants || 'None'}</div>
                    <div><span class="label">Paid by:</span> ${payers}</div>
                  </div>
                </div>
              `;
            });
          }
        }

        // Build summary table
        const summaryRows = summaryTable.querySelectorAll('tbody tr');
        let summaryHtml = '';
        summaryRows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const netClass = cells[3].classList.contains('net-positive') ? 'positive' : (cells[3].classList.contains('net-negative') ? 'negative' : '');
            summaryHtml += `
              <tr>
                <td>${cells[0].textContent}</td>
                <td>${cells[1].textContent}</td>
                <td>${cells[2].textContent}</td>
                <td class="${netClass}">${cells[3].textContent}</td>
              </tr>
            `;
          }
        });

        // Build settlements
        const settlementItems = settlementsList.querySelectorAll('li');
        let settlementsHtml = '';
        settlementItems.forEach(item => {
          settlementsHtml += `<li>${item.textContent.trim()}</li>`;
        });

        // Calculate grand total
        let grandTotal = 0;
        if (state.scenario === 'restaurant') {
          grandTotal = state.restaurant.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.qty || 1)), 0);
          if (state.restaurant.taxTipEnabled) grandTotal += state.restaurant.taxTipAmount || 0;
        } else if (state.scenario === 'group-expense') {
          grandTotal = state.groupExpense.items.reduce((sum, item) => sum + ((item.amount || 0) * (item.qty || 1)), 0);
        } else {
          grandTotal = state.trip.lodgingItems.reduce((sum, item) => sum + (item.amount || 0), 0);
          grandTotal += state.trip.sharedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        }

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${scenarioName} - ${today}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 60px; margin: 0; color: #1f2937; font-size: 14px; }
              h1 { font-size: 24px; margin-bottom: 4px; }
              h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #F54900; }
              h3.section-title { font-size: 14px; margin: 16px 0 8px; color: #6b7280; }
              .date { color: #6b7280; font-size: 14px; margin-bottom: 8px; }
              .people { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
              .expense-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
              .expense-header { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px; }
              .expense-name { }
              .expense-amount { color: #F54900; }
              .expense-details { font-size: 12px; color: #6b7280; }
              .expense-details > div { margin: 4px 0; }
              .label { color: #9ca3af; }
              .payer-summary { font-size: 13px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
              .grand-total { background: #FFF7ED; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 16px; margin: 16px 0; display: flex; justify-content: space-between; font-weight: 600; }
              .grand-total .amount { font-size: 18px; color: #F54900; }
              table { width: 100%; border-collapse: collapse; margin: 12px 0; }
              th { text-align: left; padding: 8px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
              td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
              .positive { color: #10b981; font-weight: 600; }
              .negative { color: #ef4444; font-weight: 600; }
              .settlement-box { background: linear-gradient(145deg, #ff5a1a 0%, #F54900 100%); border-radius: 12px; padding: 16px 20px; color: white; margin: 16px 0; }
              .settlement-box h2 { color: white; border-bottom-color: rgba(255,255,255,0.3); margin-top: 0; }
              .settlement-box ul { margin: 0; padding: 0; list-style: none; }
              .settlement-box li { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
              .settlement-box li:last-child { border-bottom: none; }
              .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
              @media print { body { padding: 20px 40px; } @page { margin: 0.5in; } }
            </style>
          </head>
          <body>
            <h1>${scenarioName}</h1>
            <p class="date">Generated on ${today}</p>
            <p class="people"><strong>People:</strong> ${peopleNames}</p>

            <h2>Expenses</h2>
            ${expensesHtml}

            <div class="grand-total">
              <span>Grand Total</span>
              <span class="amount">${formatCurrency(grandTotal)}</span>
            </div>

            <h2>Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Owes</th>
                  <th>Paid</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                ${summaryHtml}
              </tbody>
            </table>

            <div class="settlement-box">
              <h2>Settlement Plan</h2>
              <ul>${settlementsHtml}</ul>
            </div>

            <div class="footer">
              Generated by SplitBillsFairly.com
            </div>
          </body>
          </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      });
    }

    // ============================================
    // Initialize
    // ============================================

    renderPeopleList();
    updateAllUI();
  }

  // ============================================
  // Embed Modal
  // ============================================

  function initEmbedModal() {
    const embedBtn = $('embed-btn');
    const modal = $('embed-modal');
    const modalClose = modal ? modal.querySelector('.modal-close') : null;
    const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;
    const copyEmbedBtn = $('copy-embed');
    const embedCode = $('embed-code');

    if (!embedBtn || !modal) return;

    let previouslyFocused = null;

    function openModal() {
      previouslyFocused = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';

      // Focus the close button
      setTimeout(() => modalClose.focus(), 50);

      // Trap focus
      modal.addEventListener('keydown', trapFocus);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      modal.removeEventListener('keydown', trapFocus);

      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }

    function trapFocus(e) {
      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    embedBtn.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    if (copyEmbedBtn && embedCode) {
      copyEmbedBtn.addEventListener('click', () => {
        copyToClipboard(embedCode.value, copyEmbedBtn);
      });
    }
  }

  // ============================================
  // Return to Calculator Button
  // ============================================

  function initReturnButton() {
    const returnBtn = $('return-btn');
    const backToTop = $('back-to-top');
    const calculatorSection = $('calculator');

    if (!calculatorSection) return;

    function updateVisibility() {
      const rect = calculatorSection.getBoundingClientRect();
      // Show buttons when calculator is above viewport
      const shouldShow = rect.bottom < 0;

      if (returnBtn) {
        if (shouldShow) {
          returnBtn.classList.add('visible');
        } else {
          returnBtn.classList.remove('visible');
        }
      }

      if (backToTop) {
        if (shouldShow) {
          backToTop.classList.add('visible');
        } else {
          backToTop.classList.remove('visible');
        }
      }
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  // ============================================
  // Initialize
  // ============================================

  function init() {
    initNavigation();
    initTabs();
    initEvenSplitCalculator();
    initGroupExpensesCalculator();
    initEmbedModal();
    initReturnButton();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

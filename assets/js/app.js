/**
 * Overtime Pay Calculator - Application
 * Pure vanilla JavaScript, no dependencies
 */

(function() {
  'use strict';

  // ============================================
  // Currency Configuration
  // ============================================

  const CURRENCIES = {
    USD: { symbol: '$', locale: 'en-US', decimals: 2 },
    GBP: { symbol: '£', locale: 'en-GB', decimals: 2 },
    EUR: { symbol: '€', locale: 'de-DE', decimals: 2 },
    CAD: { symbol: 'C$', locale: 'en-CA', decimals: 2 },
    AUD: { symbol: 'A$', locale: 'en-AU', decimals: 2 },
    JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0 }
  };

  let currentCurrency = 'USD';

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Format a number as currency based on selected currency
   */
  function formatCurrency(amount, currency) {
    currency = currency || currentCurrency;
    const config = CURRENCIES[currency] || CURRENCIES.USD;

    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals
      }).format(amount);
    } catch (e) {
      // Fallback formatting
      return config.symbol + Math.abs(amount).toFixed(config.decimals);
    }
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
      const originalText = button.textContent;
      button.textContent = 'Failed';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function() {
        fallbackCopy(text, onSuccess, onError);
      });
    } else {
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
  // Overtime Pay Calculator
  // ============================================

  function initOvertimeCalculator() {
    // DOM Elements - support both main page and embed page IDs
    const currencySelect = $('currency-select') || $('currency');
    const hourlyRateInput = $('hourly-rate');
    const overtimeMultiplierSelect = $('overtime-multiplier');
    const customMultiplierGroup = $('custom-multiplier-group');
    const customMultiplierInput = $('custom-multiplier');
    const overtimeRateInput = $('overtime-rate-direct') || $('overtime-rate');
    const overtimeHoursInput = $('overtime-hours');
    const regularHoursInput = $('regular-hours');

    // Buttons - support both ID formats
    const calculateBtn = $('calculate-btn');
    const resetBtn = $('reset-calculator') || $('reset-btn');
    const copyBtn = $('copy-result');

    // Helper elements - support both main page and embed page
    const helperToggle = $('helper-toggle');
    const helperContent = $('helper-content');
    const payTimeframeSelect = $('pay-timeframe');
    const totalPayInput = $('total-pay-timeframe') || $('total-pay');
    const weeklyHoursInput = $('weekly-regular-hours') || $('weekly-hours');
    const calculateHourlyBtn = $('calculate-hourly');
    const helperResult = $('helper-result');
    const calculatedHourlyDisplay = $('calculated-hourly');
    const useCalculatedRateBtn = $('use-calculated-rate');

    // Result elements - main page
    const overtimeTotal = $('overtime-total');
    const resultOtHours = $('result-ot-hours');
    const resultOtRate = $('result-ot-rate');
    const regularPayTotal = $('regular-pay-total');
    const resultRegularHours = $('result-regular-hours');
    const resultHourlyRate = $('result-hourly-rate');
    const resultOtPayLine = $('result-ot-pay-line');
    const totalPayDisplay = $('total-pay');

    // Result elements - embed page fallbacks
    const overtimePayResult = $('overtime-pay-result');
    const overtimeRateDisplay = $('overtime-rate-display');
    const regularPayDisplay = $('regular-pay-display');
    const totalPayDisplayEmbed = $('total-pay-display');

    // Error elements
    const hourlyRateError = $('hourly-rate-error');
    const overtimeHoursError = $('overtime-hours-error');

    // Check if we have enough elements to initialize
    if (!hourlyRateInput && !calculateBtn) return;

    // ============================================
    // Event Listeners
    // ============================================

    // Currency change
    if (currencySelect) {
      currencySelect.addEventListener('change', () => {
        currentCurrency = currencySelect.value;
        // Recalculate if we have values
        if (hourlyRateInput && hourlyRateInput.value) {
          calculate();
        }
      });
    }

    // Overtime multiplier change - show/hide custom input
    if (overtimeMultiplierSelect) {
      overtimeMultiplierSelect.addEventListener('change', () => {
        if (overtimeMultiplierSelect.value === 'other') {
          if (customMultiplierGroup) customMultiplierGroup.classList.remove('hidden');
        } else {
          if (customMultiplierGroup) customMultiplierGroup.classList.add('hidden');
        }
        // Recalculate
        if (hourlyRateInput && hourlyRateInput.value && overtimeHoursInput && overtimeHoursInput.value) {
          calculate();
        }
      });
    }

    // Helper toggle - for embed page style
    if (helperToggle && helperContent) {
      helperToggle.addEventListener('click', () => {
        const isExpanded = helperToggle.getAttribute('aria-expanded') === 'true';
        helperToggle.setAttribute('aria-expanded', !isExpanded);
        helperContent.classList.toggle('hidden');
      });
    }

    // Calculate hourly rate from pay period
    if (calculateHourlyBtn && totalPayInput && payTimeframeSelect) {
      calculateHourlyBtn.addEventListener('click', () => {
        const timeframe = payTimeframeSelect.value;
        const totalPay = parseFloat(totalPayInput.value) || 0;
        const weeklyHours = parseFloat(weeklyHoursInput ? weeklyHoursInput.value : 40) || 40;

        if (totalPay <= 0 || weeklyHours <= 0) {
          if (helperResult) {
            helperResult.classList.add('hidden');
            helperResult.textContent = '';
          }
          return;
        }

        // Calculate weeks in timeframe
        let weeksInTimeframe;
        switch (timeframe) {
          case 'week':
            weeksInTimeframe = 1;
            break;
          case '2weeks':
            weeksInTimeframe = 2;
            break;
          case 'month':
            weeksInTimeframe = 4; // Standard 160 hours/month (4 weeks × 40 hours)
            break;
          case 'annual':
            weeksInTimeframe = 52;
            break;
          default:
            weeksInTimeframe = 1;
        }

        const hourlyRate = totalPay / (weeksInTimeframe * weeklyHours);

        if (helperResult) {
          helperResult.classList.remove('hidden');
          // Support both main page and embed page result display
          if (calculatedHourlyDisplay) {
            calculatedHourlyDisplay.textContent = formatCurrency(hourlyRate);
          } else {
            helperResult.innerHTML = `Your hourly rate: <strong>${formatCurrency(hourlyRate)}</strong> <button class="btn btn-sm btn-primary" id="use-rate-btn">Use This Rate</button>`;
            // Attach event listener to dynamically created button
            const useRateBtn = $('use-rate-btn');
            if (useRateBtn) {
              useRateBtn.addEventListener('click', () => {
                if (hourlyRateInput) {
                  hourlyRateInput.value = hourlyRate.toFixed(2);
                  calculate();
                }
              });
            }
          }
          // Store calculated rate for use
          helperResult.dataset.calculatedRate = hourlyRate.toFixed(4);
        }
      });
    }

    // Use calculated rate button (embed page style)
    if (useCalculatedRateBtn && helperResult) {
      useCalculatedRateBtn.addEventListener('click', () => {
        const rate = parseFloat(helperResult.dataset.calculatedRate);
        if (rate && hourlyRateInput) {
          hourlyRateInput.value = rate.toFixed(2);
          // Collapse helper if available
          if (helperToggle) {
            helperToggle.setAttribute('aria-expanded', 'false');
          }
          if (helperContent) {
            helperContent.classList.add('hidden');
          }
          calculate();
        }
      });
    }

    // Calculate button (if exists)
    if (calculateBtn) {
      calculateBtn.addEventListener('click', calculate);
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', reset);
    }

    // Copy button
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const hourlyRate = parseFloat(hourlyRateInput.value) || 0;
        const overtimeHours = parseFloat(overtimeHoursInput.value) || 0;
        const regularHours = parseFloat(regularHoursInput ? regularHoursInput.value : 40) || 40;

        const multiplier = getMultiplier();
        let overtimeRate = overtimeRateInput ? parseFloat(overtimeRateInput.value) : 0;
        if (!overtimeRate || overtimeRate <= 0) {
          overtimeRate = hourlyRate * multiplier;
        }

        const overtimePay = overtimeRate * overtimeHours;
        const regularPay = hourlyRate * regularHours;
        const totalPay = overtimePay + regularPay;

        let text = '💰 Overtime Pay Calculation\n';
        text += '─────────────────\n';
        text += `Hourly Rate: ${formatCurrency(hourlyRate)}\n`;
        text += `Overtime Multiplier: ${multiplier}x\n`;
        text += `Overtime Rate: ${formatCurrency(overtimeRate)}/hr\n`;
        text += `Overtime Hours: ${overtimeHours}\n`;
        text += `Regular Hours: ${regularHours}\n`;
        text += '─────────────────\n';
        text += `Overtime Pay: ${formatCurrency(overtimePay)}\n`;
        text += `Regular Pay: ${formatCurrency(regularPay)}\n`;
        text += `Total Pay: ${formatCurrency(totalPay)}\n`;
        text += '\n📱 Calculate your overtime at calculateovertimepay.com';

        copyToClipboard(text, copyBtn);
      });
    }

    // Auto-calculate on input change for real-time updates
    const inputsToWatch = [hourlyRateInput, overtimeHoursInput, regularHoursInput, overtimeRateInput, customMultiplierInput];
    inputsToWatch.forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          // Only auto-calculate if we have minimum required values
          if (hourlyRateInput && hourlyRateInput.value) {
            calculate();
          }
        });
      }
    });

    // ============================================
    // Calculation Functions
    // ============================================

    function getMultiplier() {
      if (overtimeMultiplierSelect && overtimeMultiplierSelect.value === 'other') {
        return parseFloat(customMultiplierInput ? customMultiplierInput.value : 1.5) || 1.5;
      }
      return parseFloat(overtimeMultiplierSelect ? overtimeMultiplierSelect.value : 1.5) || 1.5;
    }

    function calculate() {
      // Clear errors
      if (hourlyRateError) hourlyRateError.textContent = '';
      if (overtimeHoursError) overtimeHoursError.textContent = '';
      if (hourlyRateInput) hourlyRateInput.classList.remove('error');
      if (overtimeHoursInput) overtimeHoursInput.classList.remove('error');

      const hourlyRate = parseFloat(hourlyRateInput ? hourlyRateInput.value : 0) || 0;
      const overtimeHours = parseFloat(overtimeHoursInput ? overtimeHoursInput.value : 0) || 0;
      const regularHours = parseFloat(regularHoursInput ? regularHoursInput.value : 40) || 40;

      // Validation
      let hasError = false;

      if (hourlyRateInput && hourlyRateInput.value && hourlyRate < 0) {
        if (hourlyRateError) hourlyRateError.textContent = 'Please enter a positive rate';
        hourlyRateInput.classList.add('error');
        hasError = true;
      }

      if (overtimeHoursInput && overtimeHoursInput.value && overtimeHours < 0) {
        if (overtimeHoursError) overtimeHoursError.textContent = 'Please enter positive hours';
        overtimeHoursInput.classList.add('error');
        hasError = true;
      }

      if (hasError || hourlyRate <= 0) {
        updateResults(0, 0, 0, 0, 0, 0, 0);
        return;
      }

      // Get multiplier
      const multiplier = getMultiplier();

      // Calculate overtime rate (use direct input if provided, otherwise calculate)
      let overtimeRate = overtimeRateInput ? parseFloat(overtimeRateInput.value) : 0;
      if (!overtimeRate || overtimeRate <= 0) {
        overtimeRate = hourlyRate * multiplier;
      }

      // Calculate pays
      const overtimePay = overtimeRate * overtimeHours;
      const regularPay = hourlyRate * regularHours;
      const totalPay = overtimePay + regularPay;

      // Update display
      updateResults(hourlyRate, overtimeRate, overtimeHours, regularHours, overtimePay, regularPay, totalPay);
    }

    function updateResults(hourlyRate, overtimeRate, overtimeHours, regularHours, overtimePay, regularPay, totalPay) {
      // Main page results
      if (overtimeTotal) overtimeTotal.textContent = formatCurrency(overtimePay);
      if (resultOtHours) resultOtHours.textContent = overtimeHours;
      if (resultOtRate) resultOtRate.textContent = formatCurrency(overtimeRate) + '/hr';
      if (regularPayTotal) regularPayTotal.textContent = formatCurrency(regularPay);
      if (resultRegularHours) resultRegularHours.textContent = regularHours;
      if (resultHourlyRate) resultHourlyRate.textContent = formatCurrency(hourlyRate) + '/hr';
      if (resultOtPayLine) resultOtPayLine.textContent = formatCurrency(overtimePay);
      if (totalPayDisplay) totalPayDisplay.textContent = formatCurrency(totalPay);

      // Embed page results
      if (overtimePayResult) overtimePayResult.textContent = formatCurrency(overtimePay);
      if (overtimeRateDisplay) overtimeRateDisplay.textContent = formatCurrency(overtimeRate) + '/hr';
      if (regularPayDisplay) regularPayDisplay.textContent = formatCurrency(regularPay);
      if (totalPayDisplayEmbed) totalPayDisplayEmbed.textContent = formatCurrency(totalPay);
    }

    function reset() {
      // Reset all inputs
      if (hourlyRateInput) hourlyRateInput.value = '';
      if (overtimeHoursInput) overtimeHoursInput.value = '';
      if (regularHoursInput) regularHoursInput.value = '';
      if (overtimeRateInput) overtimeRateInput.value = '';
      if (overtimeMultiplierSelect) overtimeMultiplierSelect.value = '1.5';
      if (customMultiplierInput) customMultiplierInput.value = '';
      if (customMultiplierGroup) customMultiplierGroup.classList.add('hidden');

      // Reset helper
      if (totalPayInput) totalPayInput.value = '';
      if (payTimeframeSelect) payTimeframeSelect.value = 'week';
      if (weeklyHoursInput) weeklyHoursInput.value = weeklyHoursInput.placeholder || '40';
      if (helperResult) {
        helperResult.classList.add('hidden');
        helperResult.textContent = '';
      }
      if (helperContent) helperContent.classList.add('hidden');
      if (helperToggle) helperToggle.setAttribute('aria-expanded', 'false');

      // Reset results
      updateResults(0, 0, 0, 40, 0, 0, 0);

      // Clear errors
      if (hourlyRateError) hourlyRateError.textContent = '';
      if (overtimeHoursError) overtimeHoursError.textContent = '';
      if (hourlyRateInput) hourlyRateInput.classList.remove('error');
      if (overtimeHoursInput) overtimeHoursInput.classList.remove('error');
    }

    // Initialize with default values
    updateResults(0, 0, 0, 40, 0, 0, 0);
  }

  // ============================================
  // Country Accordion
  // ============================================

  function initCountryAccordion() {
    const accordions = document.querySelectorAll('.country-accordion');

    accordions.forEach(accordion => {
      const summary = accordion.querySelector('summary');
      if (!summary) return;

      summary.addEventListener('click', (e) => {
        // Let the native details behavior handle open/close
        // We could add animations here if needed
      });
    });
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

      setTimeout(() => modalClose && modalClose.focus(), 50);
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
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

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
    initOvertimeCalculator();
    initCountryAccordion();
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

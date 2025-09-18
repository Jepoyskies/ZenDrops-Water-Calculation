document.addEventListener('DOMContentLoaded', () => {

    // --- SECTION 1: GET ALL HTML ELEMENTS ---
    const tripsContainer = document.getElementById('trips-container');
    const addTripBtn = document.getElementById('add-trip-btn');

    // Financial Card Elements
    const expensesNotes = document.getElementById("expenses-notes");
    const expensesTotal = document.getElementById("expenses-total");
    const creditsTodayNotes = document.getElementById("credits-today-notes");
    const creditsTodayTotal = document.getElementById("credits-today-total");
    const creditsPaidNotes = document.getElementById("credits-paid-notes");
    const creditsPaidTotal = document.getElementById("credits-paid-total");
    const remainingCreditsNotes = document.getElementById("remaining-credits-notes");
    const remainingCreditsTotal = document.getElementById("remaining-credits-total");
    const deductionsTotalDisplay = document.getElementById("deductions-total");
    const cashOnHandTotalDisplay = document.getElementById("cash-on-hand-total");

    let tripCounter = 0;

    // --- SECTION 2: HELPER FUNCTIONS ---
    function sumNumbersFromTextarea(textareaElement) {
        if (!textareaElement) return 0;
        const lines = textareaElement.value.split('\n');
        let total = 0;
        for (const line of lines) {
            const number = parseInt(line, 10);
            if (!isNaN(number)) {
                total += number;
            }
        }
        return total;
    }

    function sumPickUpsFromNotes(textareaElement) {
        if (!textareaElement) return 0;
        const lines = textareaElement.value.split('\n');
        let total = 0;
        for (const line of lines) {
            if (line.toLowerCase().includes('pick up')) {
                const number = parseInt(line, 10);
                if (!isNaN(number)) {
                    total += number;
                }
            }
        }
        return total;
    }
    
    function sumNonSalesFromNotes(textareaElement) {
        return sumNumbersFromTextarea(textareaElement);
    }
    
    // --- SECTION 3: DYNAMIC TRIP MANAGEMENT ---
    function addTripCard() {
        tripCounter++;
        const tripCardHTML = `
            <div class="trip-card" data-trip-id="${tripCounter}">
                <div class="trip-details">
                    <div class="form-group">
                        <input type="date" id="date${tripCounter}">
                    </div>
                    <div class="form-group">
                        <input type="text" id="trip${tripCounter}-title" placeholder="Trip ${tripCounter} Title">
                    </div>
                    <div class="form-group">
                        <input type="text" class="delivered-gallons" placeholder="Delivered (e.g., 35)">
                    </div>
                     <div class="form-group">
                        <input type="text" class="returned-unopened" placeholder="Returned Unopened (e.g., 1 Return may laman)">
                    </div>
                    <div class="form-group amount-group">
                        <label for="amount25-${tripCounter}">25x</label>
                        <input type="number" class="amount25" id="amount25-${tripCounter}" placeholder='""'>
                    </div>
                    <div class="form-group amount-group">
                        <label for="amount20-${tripCounter}">20x</label>
                        <input type="number" class="amount20" id="amount20-${tripCounter}" placeholder='""'>
                    </div>
                    <div class="form-group">
                        <input type="text" class="brand-new-info" placeholder="Brand New (e.g., 1 brand new gallon 180)">
                    </div>

                    <div class="calculation-display">
                        <p>Total Gallons Sold: <span class="gallons-sold-display">0</span></p>
                        <p>Expected Empty Gallons: <span class="expected-empties-display">0</span></p>
                        <p>Total Physical Gallons Returned: <span class="returned-total-display">0</span></p>
                    </div>

                    <div class="total-area">
                        <span>Total:</span>
                        <span class="total-display trip-total">0</span>
                    </div>
                </div>
                <div class="trip-notes">
                    <div class="form-group" style="flex-grow: 1;">
                        <textarea class="sales-notes" id="sales-notes-${tripCounter}" placeholder="Sales notes (e.g., 6 pick up)"></textarea>
                    </div>
                    <div class="form-group" style="flex-grow: 1;">
                         <textarea class="free-notes" id="free-notes-${tripCounter}" placeholder="Non-sales notes (e.g., 5 house)"></textarea>
                    </div>
                     <button class="remove-trip-btn">Remove Trip</button>
                </div>
            </div>
        `;
        tripsContainer.insertAdjacentHTML('beforeend', tripCardHTML);
        const newCard = tripsContainer.querySelector(`[data-trip-id="${tripCounter}"]`);
        autoResizeTextareas(newCard.querySelectorAll('textarea'));
    }

    addTripBtn.addEventListener('click', addTripCard);
    
    addTripCard();

    // --- SECTION 4: CALCULATION FUNCTIONS ---
    function updateFinalDayTotal() {
        let totalTripAmount = 0;
        document.querySelectorAll('.trip-total').forEach(totalEl => {
            totalTripAmount += Number(totalEl.textContent) || 0;
        });

        const expenses = Number(expensesTotal.textContent) || 0;
        const creditsToday = Number(creditsTodayTotal.textContent) || 0;
        const creditsPaid = Number(creditsPaidTotal.textContent) || 0;
        const totalDeductions = expenses + creditsToday;
        const finalCashOnHand = (totalTripAmount - totalDeductions) + creditsPaid;
        deductionsTotalDisplay.textContent = totalDeductions;
        cashOnHandTotalDisplay.textContent = finalCashOnHand;
    }

    function updateTripCalculations(tripCard) {
        const deliveredText = tripCard.querySelector('.delivered-gallons').value;
        const returnedUnopenedText = tripCard.querySelector('.returned-unopened').value;
        const amount25 = Number(tripCard.querySelector('.amount25').value) || 0;
        const amount20 = Number(tripCard.querySelector('.amount20').value) || 0;
        const brandNewText = tripCard.querySelector('.brand-new-info').value;
        const salesNotes = tripCard.querySelector('.sales-notes');
        const nonSalesNotes = tripCard.querySelector('.free-notes');

        const delivered = parseInt(deliveredText) || 0;
        const returnedUnopened = parseInt(returnedUnopenedText) || 0;
        const brandNewCount = parseInt(brandNewText) || 0;
        const brandNewPrice = Number(brandNewText.match(/\d+/g)?.pop()) || 0; 
        const totalPickUps = sumPickUpsFromNotes(salesNotes);
        const totalNonSales = sumNonSalesFromNotes(nonSalesNotes);

        const gallonsEffectivelyDelivered = delivered - returnedUnopened;
        const tripTotal = (amount25 * 25) + (amount20 * 20) + brandNewPrice;
        const gallonsSold = gallonsEffectivelyDelivered - totalNonSales;
        const expectedEmpties = gallonsEffectivelyDelivered - brandNewCount - totalPickUps - totalNonSales;
        
        // --- NEW CALCULATION FOR TOTAL PHYSICAL RETURNED ---
        const totalPhysicalReturned = expectedEmpties + returnedUnopened;

        // Update all display fields
        tripCard.querySelector('.trip-total').textContent = tripTotal;
        tripCard.querySelector('.gallons-sold-display').textContent = gallonsSold;
        tripCard.querySelector('.expected-empties-display').textContent = expectedEmpties;
        tripCard.querySelector('.returned-total-display').textContent = totalPhysicalReturned;

        updateFinalDayTotal();
    }

    // --- SECTION 5: EVENT DELEGATION ---
    tripsContainer.addEventListener('input', (e) => {
        const tripCard = e.target.closest('.trip-card');
        if (!tripCard) return;

        if (e.target.matches('.amount25, .amount20')) {
            const delivered = parseInt(tripCard.querySelector('.delivered-gallons').value) || 0;
            const returnedUnopened = parseInt(tripCard.querySelector('.returned-unopened').value) || 0;
            const nonSalesNotes = tripCard.querySelector('.free-notes');
            const totalNonSales = sumNonSalesFromNotes(nonSalesNotes);
            
            const gallonsAvailableForSale = (delivered - returnedUnopened) - totalNonSales;

            let amount25 = Number(tripCard.querySelector('.amount25').value) || 0;
            let amount20 = Number(tripCard.querySelector('.amount20').value) || 0;

            if (amount25 + amount20 > gallonsAvailableForSale) {
                e.target.value = e.target.value.slice(0, -1);
            }
        }
        
        updateTripCalculations(tripCard);
    });

    tripsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-trip-btn')) {
            e.target.closest('.trip-card').remove();
            updateFinalDayTotal();
        }
    });

    // --- FINANCIAL CARD LISTENERS ---
    expensesNotes.addEventListener("input", () => {
        expensesTotal.textContent = sumNumbersFromTextarea(expensesNotes);
        updateFinalDayTotal();
    });
    creditsTodayNotes.addEventListener("input", () => {
        creditsTodayTotal.textContent = sumNumbersFromTextarea(creditsTodayNotes);
        updateFinalDayTotal();
    });
    creditsPaidNotes.addEventListener("input", () => {
        creditsPaidTotal.textContent = sumNumbersFromTextarea(creditsPaidNotes);
        updateFinalDayTotal();
    });
    remainingCreditsNotes.addEventListener("input", () => {
        remainingCreditsTotal.textContent = sumNumbersFromTextarea(remainingCreditsNotes);
    });

    function autoResizeTextareas(textareas) {
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });
    }
    autoResizeTextareas(document.querySelectorAll('textarea'));
});
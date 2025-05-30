function calculatePregnancyWeek(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    
    // Calculate conception date (approximately 2 weeks before LMP)
    // Pregnancy is calculated from Last Menstrual Period (LMP)
    // Due date is 40 weeks from LMP
    const lmpDate = new Date(due.getTime() - (40 * 7 * 24 * 60 * 60 * 1000));
    
    // Calculate weeks from LMP
    const daysDifference = Math.floor((now - lmpDate) / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(daysDifference / 7);
    
    return Math.max(0, Math.min(42, weeks)); // Cap between 0 and 42 weeks
}

function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

function parseDate(dateString) {
    // Parse DD/MM/YYYY format
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(match[3], 10);
    
    const date = new Date(year, month, day);
    
    // Verify the date components match (handles invalid dates like 31/02/2024)
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
        return null;
    }
    
    return date;
}

function formatDateHindi(date) {
    const months = [
        'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
        'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
    ];
    
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

module.exports = {
    calculatePregnancyWeek,
    isValidDate,
    parseDate,
    formatDateHindi
};

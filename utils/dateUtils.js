function calculatePregnancyWeek(conceptionDate) {
    const now = new Date();
    const conception = new Date(conceptionDate);
    
    // If conception date is in future, return 0
    if (conception > now) {
        return 0;
    }
    
    // Calculate weeks from conception date
    const daysDifference = Math.floor((now - conception) / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(daysDifference / 7);
    
    // Return weeks (0 to 42 weeks maximum)
    return Math.max(0, Math.min(42, weeks));
}

function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
}

function parseDate(dateString) {
    // Clean the input string - remove any extra characters
    const cleanedString = dateString.trim();
    
    // Parse DD/MM/YYYY format
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleanedString.match(regex);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(match[3], 10);
    
    // Check if day and month are in valid ranges
    if (day < 1 || day > 31 || month < 0 || month > 11) {
        return null;
    }
    
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

function isValidConceptionDate(date) {
    if (!isValidDate(date)) return false;
    
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    
    const tenMonthsAgo = new Date();
    tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);
    tenMonthsAgo.setHours(0, 0, 0, 0); // Set to start of day
    
    return date >= tenMonthsAgo && date <= today;
}

module.exports = {
    calculatePregnancyWeek,
    isValidDate,
    parseDate,
    formatDateHindi,
    isValidConceptionDate
};

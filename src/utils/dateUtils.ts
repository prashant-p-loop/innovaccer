export const calculateAge = (dobString: string): number => {
  try {
    const parts = dobString.split('/');
    if (parts.length !== 3) {
      throw new Error('Invalid date format');
    }
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    const dob = new Date(year, month, day);
    const today = new Date();
    
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  } catch (e) {
    console.error('Error calculating age:', e);
    return 0;
  }
};

export const formatDateWithMonthName = (dateString: string): string => {
  if (!dateString) return '';
  
  const parts = dateString.split('/');
  if (parts.length !== 3) return dateString;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 0 || month > 11) {
    return dateString;
  }
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return `${day}/${monthNames[month]}/${year}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};
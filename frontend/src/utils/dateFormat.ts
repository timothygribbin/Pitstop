export const formatDate = (dateString: string): string => {
 const date = new Date(dateString);
 return date.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
 });
};

export const formatDateRange = (startDate: string, endDate: string): string => {
 const start = new Date(startDate);
 const end = new Date(endDate);
 
 // If dates are in the same month and year
 if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric' })}, ${start.toLocaleDateString('en-US', { year: 'numeric' })}`;
 }
 
 // If dates are in the same year but different months
 if (start.getFullYear() === end.getFullYear()) {
  return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${start.toLocaleDateString('en-US', { year: 'numeric' })}`;
 }
 
 // If dates are in different years
 return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
}; 
import { useState, useEffect } from 'react';
import { LeaseData } from '../types';
import './ExtractedData.css';

interface ExtractedDataProps {
  data: LeaseData;
}

const ExtractedData: React.FC<ExtractedDataProps> = ({ data: initialData }) => {
  // State to hold editable data
  const [data, setData] = useState<LeaseData>(initialData);
  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
  // Add temporary edit values state
  const [editValues, setEditValues] = useState<{ [key: string]: any }>({});
  
  // Update local data when initialData changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Helper function to parse dates more robustly
  const parseDate = (dateString: string | null): Date | null => {
    if (!dateString) return null;
    
    try {
      // Handle ISO format dates (YYYY-MM-DD) from input elements
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // For ISO format, use UTC to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      }
      
      // Try standard date parsing first
      const date = new Date(dateString);
      
      // Check if valid
      if (!isNaN(date.getTime())) {
        // Adjust for timezone to ensure the date is preserved
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + userTimezoneOffset);
      }
      
      // Try to handle common date formats
      // Format: "Month Day, Year" (e.g., "June 30, 2024")
      const monthDayYearRegex = /([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/;
      const mdyMatch = dateString.match(monthDayYearRegex);
      
      if (mdyMatch) {
        const months = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
        };
        
        const monthName = mdyMatch[1].toLowerCase();
        const day = parseInt(mdyMatch[2], 10);
        const year = parseInt(mdyMatch[3], 10);
        
        // @ts-ignore - TypeScript doesn't know about our months object
        const monthIndex = months[monthName];
        
        if (monthIndex !== undefined && !isNaN(day) && !isNaN(year)) {
          // Use UTC to avoid timezone issues
          return new Date(Date.UTC(year, monthIndex, day));
        }
      }
      
      // Format: MM/DD/YYYY
      const slashDateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
      const slashMatch = dateString.match(slashDateRegex);
      
      if (slashMatch) {
        const month = parseInt(slashMatch[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(slashMatch[2], 10);
        const year = parseInt(slashMatch[3], 10);
        
        // Use UTC to avoid timezone issues
        return new Date(Date.UTC(year, month, day));
      }
      
      console.warn('Could not parse date:', dateString);
      return null;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };

  // Calculate lease term from start and end dates if not provided
  const calculateLeaseTerm = (): number | null => {
    // If month-to-month is explicitly set to false, always calculate from dates
    if (data.isMonthToMonth === false) {
      // Force calculation from dates for non-month-to-month leases
      if (data.startDate && data.endDate) {
        try {
          const start = parseDate(data.startDate);
          const end = parseDate(data.endDate);
          
          console.log('Calculating lease term for non-month-to-month lease:', {
            startDate: data.startDate,
            parsedStart: start,
            endDate: data.endDate,
            parsedEnd: end
          });
          
          // Ensure valid dates
          if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.warn('Invalid date detected');
            return null;
          }
          
          // Check if end date is before start date
          if (end < start) {
            console.warn('End date is before start date');
            return null;
          }
          
          // Method 1: Calculate months difference accounting for day of month
          let months = (end.getFullYear() - start.getFullYear()) * 12;
          months += end.getMonth() - start.getMonth();
          
          // Adjust for day of month
          if (end.getDate() < start.getDate()) {
            // If end day is earlier in the month than start day, subtract a month
            months--;
          }
          
          // Method 2: Calculate days and convert to months
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffMonthsByDays = Math.round(diffDays / 30.44);
          
          console.log('Lease term calculation details:', {
            monthsMethod1: months,
            days: diffDays,
            monthsMethod2: diffMonthsByDays
          });
          
          // Use the larger of the two calculations to ensure we don't underestimate
          const calculatedMonths = Math.max(months, diffMonthsByDays);
          
          // Ensure we return at least 1 month for any positive duration
          return calculatedMonths > 0 ? calculatedMonths : 1;
        } catch (error) {
          console.error('Error calculating lease term:', error);
          return null;
        }
      }
      return null;
    }
    
    // For month-to-month or unspecified, use provided lease term if available
    if (data.leaseTerm) return data.leaseTerm;
    
    // Otherwise calculate from dates
    if (data.startDate && data.endDate) {
      try {
        const start = parseDate(data.startDate);
        const end = parseDate(data.endDate);
        
        // Ensure valid dates
        if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.warn('Invalid date detected');
          return null;
        }
        
        // Check if end date is before start date
        if (end < start) {
          console.warn('End date is before start date');
          return null;
        }
        
        // Method 1: Calculate months difference accounting for day of month
        let months = (end.getFullYear() - start.getFullYear()) * 12;
        months += end.getMonth() - start.getMonth();
        
        // Adjust for day of month
        if (end.getDate() < start.getDate()) {
          // If end day is earlier in the month than start day, subtract a month
          months--;
        }
        
        // Method 2: Calculate days and convert to months
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonthsByDays = Math.round(diffDays / 30.44);
        
        // Use the larger of the two calculations to ensure we don't underestimate
        const calculatedMonths = Math.max(months, diffMonthsByDays);
        
        // Ensure we return at least 1 month for any positive duration
        return calculatedMonths > 0 ? calculatedMonths : 1;
      } catch (error) {
        console.error('Error calculating lease term:', error);
        return null;
      }
    }
    
    return null;
  };
  
  // Calculate annual rent from monthly rent and lease term if not provided
  const calculateAnnualRent = (): number | null => {
    if (data.annualRent) return data.annualRent;
    
    if (data.monthlyRent) {
      // If it's a 12-month lease or longer, multiply by 12
      const leaseTerm = calculateLeaseTerm();
      
      if (leaseTerm && leaseTerm >= 12) {
        return data.monthlyRent * 12;
      } else if (data.isMonthToMonth) {
        // For month-to-month, also calculate annual as 12 months
        return data.monthlyRent * 12;
      } else if (leaseTerm) {
        // For shorter leases, multiply by the lease term
        return data.monthlyRent * leaseTerm;
      }
    }
    
    return null;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = parseDate(dateString);
    if (!date) return dateString; // Return original string if parsing fails
    
    // Use UTC methods to avoid timezone issues
    return new Date(date.getTime()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC' // Use UTC timezone to preserve the date
    });
  };
  
  // Start editing a field
  const startEditing = (field: keyof LeaseData) => {
    // Initialize edit value with current value
    setEditValues(prev => ({ 
      ...prev, 
      [field]: data[field] 
    }));
    setEditing(prev => ({ ...prev, [field]: true }));
  };
  
  // Handle input changes (updates temporary state only)
  const handleInputChange = (field: keyof LeaseData, value: any) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };
  
  // Save changes
  const saveChanges = (field: keyof LeaseData) => {
    let parsedValue = editValues[field];
    
    // Handle specific field types
    if (field === 'monthlyRent' || field === 'annualRent') {
      // Parse currency input
      if (typeof parsedValue === 'string') {
        parsedValue = parseFloat(parsedValue.replace(/[^0-9.-]+/g, ''));
        if (isNaN(parsedValue)) parsedValue = null;
      }
    } else if (field === 'leaseTerm') {
      // Parse numeric input
      if (typeof parsedValue === 'string') {
        parsedValue = parseInt(parsedValue, 10);
        if (isNaN(parsedValue)) parsedValue = null;
      }
    } else if (field === 'startDate' || field === 'endDate') {
      // Special handling for date fields to preserve the exact date
      if (typeof parsedValue === 'string' && parsedValue.trim()) {
        // For ISO format from date inputs (YYYY-MM-DD)
        if (parsedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Store the date in ISO format to avoid timezone issues
          const [year, month, day] = parsedValue.split('-').map(Number);
          // Create a date in UTC and format it to ISO
          const date = new Date(Date.UTC(year, month - 1, day));
          parsedValue = date.toISOString().split('T')[0];
          console.log(`Saving ${field} as: ${parsedValue}`);
        } else {
          // For other formats, parse and then format to ISO
          const date = parseDate(parsedValue);
          if (date) {
            parsedValue = date.toISOString().split('T')[0];
          }
        }
      }
    } else if (field === 'isMonthToMonth' || field === 'isSigned') {
      // Parse boolean
      if (typeof parsedValue === 'string') {
        parsedValue = parsedValue === 'true';
      }
    }
    
    // Update the data
    setData(prevData => {
      const newData = { ...prevData, [field]: parsedValue };
      
      // If monthly rent is updated and annual rent is calculated, clear annual rent
      if (field === 'monthlyRent' && newData.annualRent === initialData.annualRent) {
        newData.annualRent = null;
      }
      
      // If start date or end date is updated, clear lease term to recalculate
      if ((field === 'startDate' || field === 'endDate') && newData.leaseTerm === initialData.leaseTerm) {
        newData.leaseTerm = null;
      }
      
      // If month-to-month status changes, clear lease term to recalculate
      if (field === 'isMonthToMonth' && newData.leaseTerm === initialData.leaseTerm) {
        newData.leaseTerm = null;
        console.log('Month-to-month status changed, clearing lease term for recalculation');
      }
      
      return newData;
    });
    
    // Exit edit mode
    setEditing(prev => ({ ...prev, [field]: false }));
  };
  
  // Cancel editing
  const cancelEditing = (field: string) => {
    setEditing(prev => ({ ...prev, [field]: false }));
    // Clear temporary edit value
    setEditValues(prev => {
      const newValues = { ...prev };
      delete newValues[field];
      return newValues;
    });
  };
  
  // Handle key press (for Enter to save)
  const handleKeyPress = (e: React.KeyboardEvent, field: keyof LeaseData) => {
    if (e.key === 'Enter') {
      saveChanges(field);
    } else if (e.key === 'Escape') {
      cancelEditing(field);
    }
  };

  // Get the calculated values
  const leaseTerm = calculateLeaseTerm();
  const annualRent = calculateAnnualRent();
  
  // Render editable field
  const renderEditableField = (
    field: keyof LeaseData, 
    label: string, 
    value: any, 
    formatter: (val: any) => string,
    inputType: 'text' | 'number' | 'date' | 'select' = 'text',
    options?: { value: any, label: string }[]
  ) => {
    const isEditing = editing[field];
    let displayValue = formatter(value);
    
    // Get input value from editValues if editing, or from data if not
    let inputValue = isEditing ? editValues[field] : value;
    
    // Format input value for date fields
    if (inputType === 'date' && inputValue) {
      const date = parseDate(inputValue);
      if (date) {
        // Format as YYYY-MM-DD for date input, ensuring we use UTC to preserve the day
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        inputValue = `${year}-${month}-${day}`;
        console.log(`Formatted date for input: ${inputValue}`);
      }
    }
    
    return (
      <div className="data-item">
        <span className="data-label">{label}</span>
        <span className="data-value">
          {isEditing ? (
            <div className="edit-controls">
              {inputType === 'select' ? (
                <select 
                  value={inputValue === null ? '' : String(inputValue)}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, field)}
                  autoFocus
                >
                  <option value="">N/A</option>
                  {options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  type={inputType} 
                  value={inputValue === null ? '' : inputValue}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, field)}
                  autoFocus
                />
              )}
              <button 
                className="save-button" 
                onClick={() => saveChanges(field)}
                title="Save"
              >
                ✓
              </button>
              <button 
                className="cancel-button" 
                onClick={() => cancelEditing(field)}
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <span className="display-value" onClick={() => startEditing(field)}>
                {displayValue}
                {field === 'annualRent' && annualRent !== initialData.annualRent && annualRent !== null && (
                  <span className="calculated-value" title="Calculated from monthly rent">
                    (calculated)
                  </span>
                )}
                {field === 'leaseTerm' && leaseTerm !== initialData.leaseTerm && leaseTerm !== null && (
                  <span className="calculated-value" title="Calculated from start and end dates">
                    (calculated)
                  </span>
                )}
                {field === 'leaseTerm' && data.isMonthToMonth === false && (
                  <span className="calculated-value" title="Fixed term lease based on start and end dates">
                    (fixed term)
                  </span>
                )}
              </span>
              <button 
                className="edit-button" 
                onClick={() => startEditing(field)}
                title="Edit"
              >
                ✎
              </button>
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="extracted-data">
      <h2>📝 Lease Details</h2>
      <div className="data-section">
        {renderEditableField(
          'monthlyRent', 
          'Monthly Rent', 
          data.monthlyRent, 
          formatCurrency,
          'number'
        )}
        
        {renderEditableField(
          'annualRent', 
          'Annual Rent', 
          annualRent, 
          formatCurrency,
          'number'
        )}
        
        {renderEditableField(
          'address', 
          'Property Address', 
          data.address, 
          val => val || 'N/A'
        )}
        
        {renderEditableField(
          'startDate', 
          'Start Date', 
          data.startDate, 
          formatDate,
          'date'
        )}
        
        {renderEditableField(
          'endDate', 
          'End Date', 
          data.endDate, 
          formatDate,
          'date'
        )}
        
        {renderEditableField(
          'leaseTerm', 
          'Lease Term', 
          leaseTerm, 
          val => val ? `${val} ${val === 1 ? 'month' : 'months'}` : 'N/A',
          'number'
        )}
        
        {renderEditableField(
          'isMonthToMonth', 
          'Month-to-Month', 
          data.isMonthToMonth, 
          val => val === null ? 'N/A' : val ? 'Yes' : 'No',
          'select',
          [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        )}
      </div>
      
      <h2>👥 Parties & Status</h2>
      <div className="data-section">
        {renderEditableField(
          'tenantName', 
          'Tenant Name', 
          data.tenantName, 
          val => val || 'N/A'
        )}
        
        {renderEditableField(
          'ownerName', 
          'Owner Name', 
          data.ownerName, 
          val => val || 'N/A'
        )}
        
        {renderEditableField(
          'isSigned', 
          'Is Signed', 
          data.isSigned, 
          val => val === null ? 'N/A' : val ? 'Yes' : 'No',
          'select',
          [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' }
          ]
        )}
      </div>
    </div>
  );
};

export default ExtractedData; 
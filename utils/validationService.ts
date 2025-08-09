export class ValidationService {
  static validateAmount(amount: string): { isValid: boolean; error?: string } {
    if (!amount || amount.trim() === '') {
      return { isValid: false, error: 'يرجى إدخال المبلغ' };
    }

    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount)) {
      return { isValid: false, error: 'يرجى إدخال رقم صحيح' };
    }

    if (numericAmount <= 0) {
      return { isValid: false, error: 'يجب أن يكون المبلغ أكبر من صفر' };
    }

    if (numericAmount > 10000000) {
      return { isValid: false, error: 'المبلغ كبير جداً' };
    }

    return { isValid: true };
  }

  static validateGoalTitle(title: string): { isValid: boolean; error?: string } {
    if (!title || title.trim() === '') {
      return { isValid: false, error: 'يرجى إدخال عنوان الهدف' };
    }

    if (title.length < 3) {
      return { isValid: false, error: 'عنوان الهدف قصير جداً' };
    }

    if (title.length > 100) {
      return { isValid: false, error: 'عنوان الهدف طويل جداً' };
    }

    return { isValid: true };
  }

  static validateDate(date: string): { isValid: boolean; error?: string } {
    if (!date) {
      return { isValid: false, error: 'يرجى اختيار التاريخ' };
    }

    const selectedDate = new Date(date);
    const today = new Date();
    
    if (selectedDate > today) {
      return { isValid: false, error: 'لا يمكن اختيار تاريخ في المستقبل' };
    }

    // Check if date is too old (more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    
    if (selectedDate < twoYearsAgo) {
      return { isValid: false, error: 'التاريخ قديم جداً' };
    }

    return { isValid: true };
  }

  static validateGoalDeadline(deadline: string): { isValid: boolean; error?: string } {
    if (!deadline) {
      return { isValid: false, error: 'يرجى اختيار تاريخ الهدف' };
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    
    if (deadlineDate <= today) {
      return { isValid: false, error: 'يجب أن يكون تاريخ الهدف في المستقبل' };
    }

    // Check if deadline is too far (more than 10 years)
    const tenYearsFromNow = new Date();
    tenYearsFromNow.setFullYear(today.getFullYear() + 10);
    
    if (deadlineDate > tenYearsFromNow) {
      return { isValid: false, error: 'تاريخ الهدف بعيد جداً' };
    }

    return { isValid: true };
  }

  static validateNote(note: string): { isValid: boolean; error?: string } {
    if (note && note.length > 500) {
      return { isValid: false, error: 'الملاحظة طويلة جداً (الحد الأقصى 500 حرف)' };
    }

    return { isValid: true };
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  static validateCategory(category: string): { isValid: boolean; error?: string } {
    const validCategories = [
      'food', 'transport', 'bills', 'entertainment', 
      'health', 'shopping', 'education', 'other'
    ];

    if (!category || !validCategories.includes(category)) {
      return { isValid: false, error: 'يرجى اختيار فئة صحيحة' };
    }

    return { isValid: true };
  }

  static validateMood(mood: string): { isValid: boolean; error?: string } {
    const validMoods = ['happy', 'neutral', 'stressed'];

    if (!mood || !validMoods.includes(mood)) {
      return { isValid: false, error: 'يرجى اختيار حالة مزاجية صحيحة' };
    }

    return { isValid: true };
  }
}
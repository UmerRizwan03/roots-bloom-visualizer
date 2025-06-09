// Helper function to parse the partners string
export const parsePartnerString = (partnersStr: string | null | undefined): string[] => {
  if (typeof partnersStr !== 'string' || partnersStr.trim() === '') {
    return [];
  }

  // Attempt JSON.parse
  try {
    const parsed = JSON.parse(partnersStr);
    if (Array.isArray(parsed)) {
      // Filter for strings first, then map and filter by length
      return parsed
        .filter(item => typeof item === 'string')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }
    // If JSON.parse succeeds but it's not an array (e.g., a single string, number, or object), it's an unexpected JSON format.
    console.warn("Partners string parsed as JSON but is not an array:", parsed);
  } catch (e) {
    // JSON.parse failed, proceed to next method or log for debugging
    // console.warn("JSON.parse failed for partners string (will try pg-like):", partnersStr, e); // Can be too noisy if pg-like is common
  }

  // Attempt PostgreSQL-like text array parsing
  if (partnersStr.startsWith('{') && partnersStr.endsWith('}')) {
    try {
      const innerStr = partnersStr.substring(1, partnersStr.length - 1);
      if (innerStr.trim() === '') return []; // Handle empty array like '{}'

      const names = innerStr.split(',').map(name => {
        let trimmedName = name.trim();
        if (trimmedName.startsWith('"') && trimmedName.endsWith('"')) {
          trimmedName = trimmedName.substring(1, trimmedName.length - 1);
          trimmedName = trimmedName.replace(/""/g, '"'); // Replace pg's double-quote escape ""
        }
        return trimmedName;
      }).filter(name => name.length > 0);

      if (names.length > 0 && names.some(name => name.length > 0)) {
        // console.log("Parsed partners string via pg-like array method:", names); // Optional: for debugging
        return names;
      }
    } catch (e) {
      console.error("Error parsing PostgreSQL-like array string:", partnersStr, e);
    }
  }

  console.warn("Could not parse partners string using known methods. String was:", partnersStr);
  return [];
};

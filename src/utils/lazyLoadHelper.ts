
import { lazy, ComponentType } from 'react';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  componentName: string = 'Component'
) {
  return lazy(async () => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Loading ${componentName} (attempt ${attempt})`);
        const module = await importFunc();
        console.log(`Successfully loaded ${componentName}`);
        return module;
      } catch (error) {
        console.error(`Failed to load ${componentName} (attempt ${attempt}):`, error);
        lastError = error;
        
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        }
      }
    }
    
    console.error(`Failed to load ${componentName} after ${MAX_RETRIES} attempts`);
    throw lastError;
  });
}

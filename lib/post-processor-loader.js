import { logger } from './utils/logger.js';

/**
 * Dynamic post-processor loader
 * Loads and executes framework-specific post-processors
 */
export class PostProcessorLoader {
  constructor() {
    this.processors = new Map();
  }

  /**
   * Load a post-processor for a specific framework
   */
  async loadProcessor(framework, projectPath, projectDetails) {
    try {
      // Try to load framework-specific processor
      const module = await import(`../post-processors/${framework}/index.js`);
      const ProcessorClass = module.default;
      
      if (!ProcessorClass) {
        throw new Error(`No default export found in ${framework} post-processor`);
      }

      const processor = new ProcessorClass(projectPath, framework, projectDetails);
      this.processors.set(framework, processor);
      
      logger.info(`Loaded ${framework} post-processor`);
      return processor;
    } catch (error) {
      // Fall back to base processor
      logger.warn(`Failed to load ${framework} post-processor: ${error.message}`);
      
      const { BasePostProcessor } = await import('../post-processors/common/index.js');
      const processor = new BasePostProcessor(projectPath, framework, projectDetails);
      this.processors.set(framework, processor);
      
      return processor;
    }
  }

  /**
   * Execute post-processing for a framework
   */
  async process(framework, projectPath, projectDetails) {
    let processor = this.processors.get(framework);
    
    if (!processor) {
      processor = await this.loadProcessor(framework, projectPath, projectDetails);
    }

    await processor.process();
  }

  /**
   * Get available post-processors
   */
  async getAvailableProcessors() {
    const processors = ['nextjs', 'nuxtjs', 'remix'];
    const available = [];

    for (const name of processors) {
      try {
        await import(`../post-processors/${name}/index.js`);
        available.push(name);
      } catch {
        // Processor not available
      }
    }

    return available;
  }

  /**
   * Clear cached processors
   */
  clear() {
    this.processors.clear();
  }
}

// Singleton instance
export const postProcessorLoader = new PostProcessorLoader();
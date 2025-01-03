import { StructureValidator, FileSizeValidator } from '../validation/structure';
import chalk from 'chalk';

interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning';
}

interface StructureValidationResult {
  file: string;
  issues: ValidationIssue[];
}

interface FileSizeValidationResult {
  file: string;
  lineCount: number;
  isValid: boolean;
  message: string;
}

async function validateStructure(): Promise<void> {
  const structureValidator = StructureValidator.getInstance();
  const fileSizeValidator = FileSizeValidator.getInstance();

  console.log(chalk.blue('\n📁 Running Structure Validation...\n'));

  // Structure validation
  const structureResults = await structureValidator.validateDirectory('.');
  const structureErrors = structureResults.filter((r: StructureValidationResult) => 
    r.issues.some((i: ValidationIssue) => i.severity === 'error')
  );
  const structureWarnings = structureResults.filter((r: StructureValidationResult) => 
    r.issues.every((i: ValidationIssue) => i.severity === 'warning') && r.issues.length > 0
  );

  // File size validation
  const sizeResults = await fileSizeValidator.validateDirectory('.');
  const sizeErrors = sizeResults.filter((r: FileSizeValidationResult) => !r.isValid);

  // Print results
  if (structureErrors.length > 0) {
    console.log(chalk.red('❌ Structure Errors:'));
    structureErrors.forEach((error: StructureValidationResult) => {
      console.log(chalk.red(`\n${error.file}:`));
      error.issues.forEach((issue: ValidationIssue) => {
        console.log(chalk.red(`  - ${issue.message}`));
      });
    });
  }

  if (structureWarnings.length > 0) {
    console.log(chalk.yellow('\n⚠️  Structure Warnings:'));
    structureWarnings.forEach((warning: StructureValidationResult) => {
      console.log(chalk.yellow(`\n${warning.file}:`));
      warning.issues.forEach((issue: ValidationIssue) => {
        console.log(chalk.yellow(`  - ${issue.message}`));
      });
    });
  }

  if (sizeErrors.length > 0) {
    console.log(chalk.red('\n❌ File Size Errors:'));
    sizeErrors.forEach((error: FileSizeValidationResult) => {
      console.log(chalk.red(`  - ${error.file}: ${error.message}`));
    });
  }

  const totalIssues = structureErrors.length + structureWarnings.length + sizeErrors.length;

  if (totalIssues === 0) {
    console.log(chalk.green('\n✅ All structure validations passed!\n'));
  } else {
    console.log(chalk.yellow(`\n📊 Summary:`));
    console.log(chalk.yellow(`  Structure Errors: ${structureErrors.length}`));
    console.log(chalk.yellow(`  Structure Warnings: ${structureWarnings.length}`));
    console.log(chalk.yellow(`  File Size Errors: ${sizeErrors.length}`));
    console.log(chalk.yellow(`  Total Issues: ${totalIssues}\n`));
  }
}

validateStructure().catch(error => {
  console.error(chalk.red('Error running validation:'), error);
  process.exit(1);
}); 

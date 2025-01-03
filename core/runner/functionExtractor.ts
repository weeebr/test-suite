import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { Node, FunctionDeclaration, ArrowFunctionExpression } from '@babel/types';

export class FunctionExtractor {
  public static extractFunctions(content: string): string[] {
    const functions: string[] = [];
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      FunctionDeclaration(path: { node: FunctionDeclaration }) {
        if (path.node.id?.name) {
          functions.push(path.node.id.name);
        }
      },
      ArrowFunctionExpression(path: { node: ArrowFunctionExpression; parent: Node }) {
        const parent = path.parent;
        if (parent.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
          functions.push(parent.id.name);
        }
      }
    });

    return functions;
  }
} 

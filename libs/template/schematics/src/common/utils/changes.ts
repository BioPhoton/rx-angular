import { RemoveChange } from '@nrwl/workspace/src/utils/ast-utils';
import * as ts from 'typescript';

export function createRemoveChange(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  pos = node.getStart(sourceFile),
  toRemove = node.getFullText(sourceFile)
): RemoveChange {
  return new RemoveChange(sourceFile.fileName, pos, toRemove);
}

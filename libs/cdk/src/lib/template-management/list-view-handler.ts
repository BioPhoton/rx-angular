import {
  RxListTemplateChange,
  RxListTemplateChanges,
  RxListTemplateChangeType,
  RxTemplateSettings,
} from './model';
import { EmbeddedViewRef, IterableChanges } from '@angular/core';
import { RxListViewContext } from './list-view-context';
import { createEmbeddedView } from './utils';

/**
 * @internal
 *
 * Factory that returns a `ListTemplateManager` for the passed params.
 *
 * @param templateSettings
 */
export function getTemplateHandler<C extends RxListViewContext<T>, T>(
  templateSettings: RxTemplateSettings<T, C>
): ListTemplateManager<T> {
  const {
    viewContainerRef,
    initialTemplateRef,
    createViewContext,
    updateViewContext,
    patchZone,
  } = templateSettings;

  const workFactory = patchZone
    ? (work: VoidFunction) => patchZone.run(work)
    : (work: VoidFunction) => work();

  return {
    updateUnchangedContext,
    insertView,
    moveView,
    removeView,
    getListChanges,
    updateView,
  };

  // =====

  function updateUnchangedContext(index: number, count: number) {
    const view = <EmbeddedViewRef<C>>viewContainerRef.get(index);
    workFactory(() => {
      view.context.updateContext({
        count,
        index,
      });
      view.detectChanges();
    });
  }

  function moveView(
    oldIndex: number,
    item: T,
    index: number,
    count: number
  ): void {
    let oldView;
    let view;
    // TODO: re-store
    try {
      oldView = viewContainerRef.get(oldIndex);
      view = <EmbeddedViewRef<C>>viewContainerRef.move(oldView, index);
      workFactory(() => {
        updateViewContext(item, view, {
          count,
          index,
        });
        view.detectChanges();
      });
    } catch (e) {
      console.log('oldView', oldView);
      console.log('view', view);
      console.trace(e);
      insertView(item, index, count);
    }
  }

  function updateView(item: T, index: number, count: number): void {
    const view = <EmbeddedViewRef<C>>viewContainerRef.get(index);
    workFactory(() => {
      updateViewContext(item, view, {
        count,
        index,
      });
      view.detectChanges();
    });
  }

  function removeView(index: number): void {
    return workFactory(() => viewContainerRef.remove(index));
  }

  function insertView(item: T, index: number, count: number): void {
    workFactory(() => {
      createEmbeddedView(
        viewContainerRef,
        initialTemplateRef,
        createViewContext(item, {
          count,
          index,
        }),
        index
      );
    });
  }
}

/**
 * @internal
 *
 * An object that holds methods needed to introduce actions to a list e.g. move, remove, insert
 */
export interface ListTemplateManager<T> {
  updateUnchangedContext(index: number, count: number): void;

  insertView(item: T, index: number, count: number): void;

  moveView(oldIndex: number, item: T, index: number, count: number): void;

  updateView(item: T, index: number, count: number): void;

  removeView(index: number): void;

  getListChanges(
    changes: IterableChanges<T>,
    items: T[]
  ): RxListTemplateChanges;
}

/**
 * @internal
 *
 * @param changes
 * @param items
 */
function getListChanges<T>(
  changes: IterableChanges<T>,
  items: T[]
): RxListTemplateChanges {
  const changedIdxs = new Set<T>();
  const changesArr: RxListTemplateChange[] = [];
  let notifyParent = false;
  changes.forEachOperation((record, adjustedPreviousIndex, currentIndex) => {
    const item = record.item;
    if (record.previousIndex == null) {
      // insert
      changesArr.push(getInsertChange(item, currentIndex === null ? undefined : currentIndex));
      changedIdxs.add(item);
      notifyParent = true;
    } else if (currentIndex == null) {
      // remove
      changesArr.push(getRemoveChange(item, adjustedPreviousIndex === null ? undefined : adjustedPreviousIndex));
      changedIdxs.add(item);
      notifyParent = true;
    } else if (adjustedPreviousIndex !== null) {
      // move
      changesArr.push(getMoveChange(item, currentIndex, adjustedPreviousIndex));
      changedIdxs.add(item);
      notifyParent = true;
    }
  });
  changes.forEachIdentityChange((record) => {
    const item = record.item;
    if (!changedIdxs.has(item)) {
      changesArr.push(getUpdateChange(item, record.currentIndex));
      changedIdxs.add(item);
    }
  });
  items.forEach((item, index) => {
    if (!changedIdxs.has(item)) {
      changesArr.push(getUnchangedChange(item, index));
    }
  });
  return [changesArr, notifyParent];

  // ==========

  function getMoveChange(
    item: T,
    currentIndex: number,
    adjustedPreviousIndex: number
  ): RxListTemplateChange {
    return [
      RxListTemplateChangeType.move,
      [item, currentIndex, adjustedPreviousIndex],
    ];
  }

  function getUpdateChange(
    item: T,
    currentIndex: number
  ): RxListTemplateChange {
    return [RxListTemplateChangeType.update, [item, currentIndex]];
  }

  function getUnchangedChange(item: T, index: number): RxListTemplateChange {
    return [RxListTemplateChangeType.context, [item, index]];
  }

  function getInsertChange(
    item: T,
    currentIndex: number
  ): RxListTemplateChange {
    return [
      RxListTemplateChangeType.insert,
      [item, currentIndex === null ? undefined : currentIndex],
    ];
  }

  function getRemoveChange(
    item: T,
    adjustedPreviousIndex: number
  ): RxListTemplateChange {
    return [
      RxListTemplateChangeType.remove,
      [item, adjustedPreviousIndex === null ? undefined : adjustedPreviousIndex],
    ];
  }
}

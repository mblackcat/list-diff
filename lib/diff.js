/**
 * Diff two list in O(N).
 * @param {Array} oldList - Original List
 * @param {Array} newList - List After certain insertions, removes, or moves
 * @param {String} key - key for object form list
 * @return {Object} - {moves: <Array>, changes: <Array>}
 *                  - moves is a list of actions that telling how to remove and insert
 *                  - type=0 for remove
 *                  - type=1 for insert
 *                  - changes is a list of actions that telling how changes
 *                  - type=2 for modify
 */
function diff (oldList, newList, key) {
  let oldMap = makeKeyIndexAndFree(oldList, key)
  let newMap = makeKeyIndexAndFree(newList, key)

  let newFree = newMap.free

  let oldKeyIndex = oldMap.keyIndex
  let newKeyIndex = newMap.keyIndex

  let moves = []
  let changes = []

  // a simulate list to manipulate
  let children = []
  let i = 0
  let item
  let itemKey
  let freeIndex = 0

  // fist pass to check item in old list: if it's removed or not
  while (i < oldList.length) {
    item = oldList[i]
    itemKey = getItemKey(item, key)
    if (itemKey) {
      if (!newKeyIndex.hasOwnProperty(itemKey)) {
        children.push(null)
      } else {
        let newItemIndex = newKeyIndex[itemKey]
        children.push(newList[newItemIndex])
      }
    } else {
      let freeItem = newFree[freeIndex++]
      children.push(freeItem || null)
    }
    i++
  }

  let simulateList = children.slice(0)

  // remove items no longer exist
  i = 0
  while (i < simulateList.length) {
    if (simulateList[i] === null) {
      remove(i)
      removeSimulate(i)
    } else {
      i++
    }
  }

  // i is cursor pointing to a item in new list
  // j is cursor pointing to a item in simulateList
  let j = i = 0
  let change, oldItem
  while (i < newList.length) {
    item = newList[i]
    itemKey = getItemKey(item, key)

    let simulateItem = simulateList[j]
    let simulateItemKey = getItemKey(simulateItem, key)

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        oldItem = oldList[j]
        change = diffObj(item, oldItem)
        if (change !== undefined) {
          modify(i, j, itemKey, change)
        }
        j++
      } else {
        // new item, just insert it
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i, item)
        } else {
          // if remove current simulateItem make item in right place
          // then just remove it
          let nextItemKey = getItemKey(simulateList[j + 1], key)
          if (nextItemKey === itemKey) {
            remove(i)
            removeSimulate(j)
            j++ // after removing, current j is right, just jump to next one
          } else {
            // else insert item
            insert(i, item)
          }
        }
      }
    } else {
      insert(i, item)
    }

    i++
  }

  function diffObj (newObj, oldObj) {
    let tmpLst = []
    let oldObjKeys = []
    for (let k in newObj) {
      if (newObj.hasOwnProperty(k)) {
        if (oldObj.hasOwnProperty(k)) {
          oldObjKeys.push(k)
          if (newObj[k] !== oldObj[k]) {
            tmpLst.push({key: k, newVal: newObj[k], oldVal: oldObj[k], type: 2})
          }
        } else {
          tmpLst.push({key: k, newVal: newObj[k], type: 1})
        }
      }
    }
    for (let k in oldObj) {
      if (oldObj.hasOwnProperty(k)) {
        if (oldObjKeys.indexOf(k) >= 0) {
          continue
        }
        tmpLst.push({key: k, oldVal: oldObj[k], type: 0})
      }
    }
    return tmpLst.length > 0 ? tmpLst : undefined
  }

  function remove (index) {
    let move = {index: index, type: 0}
    moves.push(move)
  }

  function insert (index, item) {
    let move = {index: index, item: item, type: 1}
    moves.push(move)
  }

  function modify (newIndex, oldIndex, itemKey, changedDict) {
    let change = {newIndex: newIndex, oldIndex: oldIndex, key: itemKey, changedDict: changedDict, type: 2}
    changes.push(change)
  }

  function removeSimulate (index) {
    simulateList.splice(index, 1)
  }

  return {
    moves: moves,
    changes: changes,
    children: children
  }
}

/**
 * Convert list to key-item keyIndex object.
 * @param {Array} list
 * @param {String|Function} key
 */
function makeKeyIndexAndFree (list, key) {
  let keyIndex = {}
  let free = []
  for (let i = 0, len = list.length; i < len; i++) {
    let item = list[i]
    let itemKey = getItemKey(item, key)
    if (itemKey) {
      keyIndex[itemKey] = i
    } else {
      free.push(item)
    }
  }
  return {
    keyIndex: keyIndex,
    free: free
  }
}

function getItemKey (item, key) {
  if (!item || !key) return void 666
  return typeof key === 'string'
    ? item[key]
    : key(item)
}

exports.makeKeyIndexAndFree = makeKeyIndexAndFree // exports for test
exports.diff = diff

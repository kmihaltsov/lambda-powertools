const _ = require('lodash/fp')

function convertToObfuscatedEvent (event, fieldsToObfuscate) {
  const obfuscatedObject = _.flow(
    _.map(getUnobfuscatedObject(event)), // Retrieve the path to the object to obfuscate { a.b.c.obfuscate }
    _.map(obfuscateObject), // Iterate through everything
    _.mergeAll,
    removeEmpties
  )(fieldsToObfuscate)

  // Deep merge the event and obfuscation together - returning an obfuscated event
  return _.merge(event, obfuscatedObject)
}

// returns the object from the fieldName
const getUnobfuscatedObject = event => fieldName => {
  const split = fieldName.split('.') || [fieldName]

  let object = {}
  let eventPointer = event
  let pointer = object
  for (let index = 0; index < split.length; index++) {
    const element = split[index]

    if (element === '*') {
      const newFieldName = split.slice(index + 1).join('.')
      const oldFieldName = split.splice(0, index)
      return _.set(oldFieldName, _.map(arrayVal => getUnobfuscatedObject(arrayVal)(newFieldName))(eventPointer), object)
    }

    eventPointer = _.get(element)(eventPointer)
    // If it's not an array we just build up the object more until the last one.
    pointer[element] = (index !== split.length - 1 && {}) || eventPointer
    pointer = pointer[element]
  }

  return object
}

const obfuscateObject = field => {
  return _.flow(
    _.map(obfuscateChildren(field)),
    _.mergeAll
  )(Object.keys(field))
}

const obfuscateChildren = field => key => {
  const newField = _.get(key)(field)

  if (newField instanceof Array) {
    return { [key]: _.map(obfuscateObject)(newField) }
  }

  if (newField instanceof Object) {
    return { [key]: obfuscateObject(newField) }
  }

  if (newField === undefined) {
    return undefined
  }

  return ({ [key]: '******' })
}

const removeEmpties = (object) => {
  return (function remove (obj) {
    for (var key in obj) {
      if (!obj[key] || typeof obj[key] !== 'object') {
        continue // If we aren't an object just continue
      }

      remove(obj[key]) // Recurse down finding the children nodes and removing them if needed
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key] // Remove the cloned elements empty child
      }
    }

    return obj // Return the cloned modified object.
  })(_.cloneDeep(object)) // Clone so as to not modify the original item
}

module.exports = convertToObfuscatedEvent

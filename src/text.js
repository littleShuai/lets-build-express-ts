const mixin = require('merge-descriptors')

let thing = {
  get name() {
    return 'json'
  }
}

let animal = {
  get age() {
    return 30;
  }
}

mixin(thing, animal)

console.log('animal: ',animal.name, 'animal: age: ', animal.age)

console.log('thing: ', thing.name, "thing: age: ", thing.age)

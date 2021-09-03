/**
 * Rewrote this in a different way.
 * Limitation we can only take it a combination of command,options/alt,control,shift + any 1 single key only
 * E.g. cmd+shift+a, control+c, control+shift+up
 *
 * Saves hotkeys in a map with key as a string ('Ctrl+a') mapped to a callbackFunction
 * listens and check if key exist. if key exist runs calbackFunction.
 *
 * TODO: Handle keys with shift keys eg '>' is recognized as 'shift+>'
 *       Handle Control + right keys where control takes precedencs in keycode
 *       reduce code base size and repeated functions
 */
 import { eventTrackerInterace } from './hotkeysTypes'
 type KeyboardEventNames = 'keydown' | 'keyup'
 
 const keycodesToKeyMap: Record<number, string> = {
   8: 'backspace',
   9: 'tab',
   13: 'return',
   19: 'break',
   20: 'capslock',
   27: 'esc',
   32: 'space',
   33: 'pageup',
   34: 'pagedown',
   35: 'end',
   36: 'home',
   37: 'left',
   38: 'up',
   39: 'right',
   40: 'down',
   45: 'insert',
   112: 'f1',
   113: 'f2',
   114: 'f3',
   115: 'f4',
   116: 'f5',
   117: 'f6',
   118: 'f7',
   119: 'f8',
   120: 'f9',
   121: 'f10',
   122: 'f11',
   123: 'f12',
   127: 'delete',
   144: 'numlock',
   145: 'scroll'
 }
 
 const hotkeysController = () => {
   const eventType: KeyboardEventNames = 'keydown'
   // I don't think we need a reactive for this?
   const eventTracker = new Map<string, eventTrackerInterace>()
   //Do we actually need this? or can we just .getEventTracker !=undefined
   const shortcutExists = new Map<string, boolean>()
 
   /**
    * Takes in a keyboardEvent and translate it into a string for us to check if event exist
    * @param e keyboardEvent
    * @returns
    */
   const eventToString = (e: Event) => {
     const hotkeyString = eventToArray(e).join('+')
     return hotkeyString
   }
 
   /**
    * Takes in a keyboardEvent and sorts it into an array. Eg.['ctrl','s']
    * @param e keyboardEvent
    * @returns string[] of keypress
    */
   const eventToArray = (e: Event) => {
     const event = e as KeyboardEvent
     //TODO:  fix this:control + right gives code 17: control instead of 39 in arrowkey might need to use .key instead of .keycode
     const keypress = event.keyCode ? event.keyCode : event.which
     // const keyvalue = String.fromCharCode(keypress).toLowerCase()
 
     const metaPressed: Record<string, boolean> = {
       Meta: event.metaKey,
       Control: event.ctrlKey,
       Shift: event.shiftKey,
       Alt: event.altKey
     }
 
     let hotkeyString = ''
     const hotkeyArray: string[] = []
     // Since this is a combination we have to go through all the ifs
     // should have a better way of mapping though then calling the format
     if (metaPressed['Meta']) hotkeyArray.push('cmd')
     if (metaPressed['Control']) hotkeyArray.push('ctrl')
     if (metaPressed['Shift']) hotkeyArray.push('shift')
     if (metaPressed['Alt']) hotkeyArray.push('alt')
     if (keycodesToKeyMap[keypress]) {
       //check if anykey in our map
       hotkeyArray.push(keycodesToKeyMap[keypress])
     } else if (event.key && metaPressed[event.key] == undefined) {
       // checks if key is normal keypress
       // as cmd is still event.key we wouldn't want to add cmd+cmd
       hotkeyArray.push(event.key)
     }
 
     return hotkeyArray
   }
 
   /**
    * Used to generate the string key for storing hotkeys
    * format/sort the input seq of a hotkey array
    *  eg. ["a","ctrl"] returns ctrl+a
    * @param hotkeys hotkey in string format for adding
    * @returns a hotkey in a particular seq
    */
   const arrayToString = (hotkeys: string[]) => {
     let formattedHotkey = ''
     const hotkeyArray: string[] = []
 
     if (hotkeys == undefined || hotkeys.length == 0) {
       return ''
     }
 
     const metaWanted = {
       Meta: false,
       Control: false,
       Shift: false,
       Alt: false
     }
 
     let key = ''
     for (let i = 0; i < hotkeys.length; i++) {
       if (hotkeys[i].toLowerCase() == 'cmd') {
         metaWanted['Meta'] = true
       } else if (hotkeys[i].toLowerCase() == 'ctrl') {
         metaWanted['Control'] = true
       } else if (hotkeys[i].toLowerCase() == 'shift') {
         metaWanted['Shift'] = true
       } else if (hotkeys[i].toLowerCase() == 'alt') {
         metaWanted['Alt'] = true
       } else {
         key = hotkeys[i]
       }
     }
     if (metaWanted['Meta']) hotkeyArray.push('cmd')
     if (metaWanted['Control']) hotkeyArray.push('ctrl')
     if (metaWanted['Shift']) hotkeyArray.push('shift')
     if (metaWanted['Alt']) hotkeyArray.push('alt')
     if (key != '') hotkeyArray.push(key)
     formattedHotkey = hotkeyArray.join('+')
 
     return formattedHotkey
   }
 
   // Lets you add a new shortcut
   /**
    * calls the function callback when the keys are pressed
    * @param hotkey Array of hotkey string
    * @param callback calllback function
    * @param el might want to depracate this unless we can figure out how to use it instead of window set ot element listener
    * @returns
    */
   const addHotkey = function (
     hotkey: string[],
     callback: () => void,
     el?: Element | Window | Document
   ) {
     // Prevents multiple additions of the same shortcut
     const formattedHotkey = arrayToString(hotkey)
     if (shortcutExists.get(formattedHotkey) === true) {
       // we can later add on to this to find conconflicts and what to do.
       return
     }
 
     const element = el ?? window
     eventTracker.set(formattedHotkey, { element: element, callback: callback })
     shortcutExists.set(formattedHotkey, true)
   }
   // --------------------------------------------------------------
 
   // Remove an event listener
   const removeHotkey = function (hotkey: string[]) {
     const hotkeyString = arrayToString(hotkey)
 
     if (shortcutExists.get(hotkeyString)) {
       //   removeListener(hotkey)
 
       eventTracker.delete(hotkeyString)
       shortcutExists.delete(hotkeyString)
     }
   }
   // (REMOVED)
   //   const removeListener = (hotkey: string) => {
   //     const element = eventTracker.get(hotkey)?.element
   //     const callback = eventTracker.get(hotkey)?.callback
   //     if (element) {
   //       element.removeEventListener(
   //         eventType,
   //         (e) => {
   //           callback
   //         },
   //         false
   //       )
   //     }
   //   }
 
   //remove everything just incase we need it on routes/unload)
   const removeAllHotkeys = () => {
     eventTracker.clear()
     shortcutExists.clear()
   }
   const initHotkeys = () => {
     const eventType: KeyboardEventNames = 'keydown'
     try {
       window.addEventListener(eventType, watcher, false)
     } catch (e) {
       console.warn(e)
     }
   }
   const stopHotkeys = () => {
     // not sure if we need to stop or auto stopped
     try {
       window.removeEventListener(eventType, watcher, false)
     } catch (e) {
       console.warn(e)
     }
   }
 
   const watcher = (e: Event) => {
     // use this to run callbacks
     const hotkeyString = eventToString(e)
     if (shortcutExists.get(hotkeyString)) {
       e.preventDefault()
       eventTracker.get(hotkeyString)?.callback()
     }
   }
 
   return {
     arrayToString,
     eventToString,
     eventToArray,
     addHotkey,
     removeHotkey,
     removeAllHotkeys,
     initHotkeys,
     stopHotkeys
   }
 }
 
 export { hotkeysController }
 
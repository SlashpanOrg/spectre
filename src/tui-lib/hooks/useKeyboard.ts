import { useCallback, useRef } from 'react'
import { useInput } from 'ink'
import { KeyInfo, KeyHandler } from '../types/keyboard.js'

export function useKeyboard(handler: KeyHandler, isActive: boolean = true) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const inputHandler = useCallback(
    (
      input: string,
      key: {
        ctrl: boolean
        shift: boolean
        meta: boolean
        escape: boolean
        return: boolean
        upArrow: boolean
        downArrow: boolean
        leftArrow: boolean
        rightArrow: boolean
        tab: boolean
        backspace: boolean
        delete: boolean
        pageUp: boolean
        pageDown: boolean
      },
    ) => {
      if (!isActive) return

      const keyInfo: KeyInfo = {
        key: input,
        ctrl: key.ctrl,
        shift: key.shift,
        meta: key.meta,
        escape: key.escape,
        return: key.return,
        upArrow: key.upArrow,
        downArrow: key.downArrow,
        leftArrow: key.leftArrow,
        rightArrow: key.rightArrow,
        tab: key.tab,
        backspace: key.backspace,
        delete: key.delete,
        pageUp: key.pageUp,
        pageDown: key.pageDown,
      }

      handlerRef.current(keyInfo)
    },
    [isActive],
  )

  useInput(inputHandler, { isActive })
}

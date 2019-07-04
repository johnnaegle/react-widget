import React, { useEffect, useRef } from 'react'
import uploadcare from 'uploadcare-widget'

import { useDestructuring } from './hooks/use-destructuring'
import { useState } from './hooks/use-state'

const containerStyles = {
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}

const Progress = ({ hidden, value }) => {
  const ref = useRef(null)
  const renderer = useRef(null)

  useEffect(() => {
    renderer.current = new uploadcare.Circle(ref.current).renderer
  }, [])

  useEffect(() => {
    renderer.current.setValue(value)
  }, [value])

  return <div hidden={hidden} ref={ref} />
}

const useDialog = (props, uploadcare) => {
  const [customTabs, options] = useDestructuring(
    ({ customTabs, ...options }) => [customTabs, options],
    props
  )

  const [state, setState] = useState({
    opened: true,
    file: null,
    progress: null
  })

  useEffect(() => {
    Object.entries(customTabs || []).forEach(([name, implementation]) => {
      uploadcare.registerTab(name, (...args) =>
        implementation(...args, uploadcare)
      )
    })
  }, [customTabs, uploadcare])

  const panelContainer = useRef(null)
  const panelInstance = useRef(null)

  useEffect(() => {
    if (state.opened) {
      panelInstance.current && panelInstance.current.reject()
      panelInstance.current = uploadcare.openPanel(
        panelContainer.current,
        state.file
          ? uploadcare.fileFrom('uploaded', state.file.uuid, options)
          : null,
        options
      )

      setState({ file: null })
      panelInstance.current.done(file => {
        setState({ opened: false })

        file.progress(state => setState({ progress: state.progress }))
        file.done(file => setState({ file }))
      })
    } else {
      // do nothing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadcare, options, setState, state.opened])

  useEffect(
    () => () => panelInstance.current && panelInstance.current.reject(),
    []
  )

  return [state, setState, panelContainer]
}

const Dialog = props => {
  const [{ opened, file, progress }, setState, containerRef] = useDialog(
    props,
    uploadcare
  )

  const readyState = file && !opened
  const progressState = !file && !opened && progress !== null

  return (
    <div id={props.id} style={containerStyles}>
      <div ref={containerRef} />

      <span hidden={!readyState}>
        <button
          className='uploadcare--button uploadcare--button_primary'
          onClick={() =>
            setState({
              opened: true,
              sourse: 'natural'
            })
          }
        >
          Open panel
        </button>
      </span>

      <span hidden={!readyState}>File uuid: </span>
      <span hidden={!readyState}>{file && file.uuid}</span>

      <Progress hidden={!progressState} value={progress} />
    </div>
  )
}

export default Dialog

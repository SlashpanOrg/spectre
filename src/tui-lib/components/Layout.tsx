import React from 'react'
import { Box } from 'ink'
import { LayoutProps } from '../types/component.js'
import { defaultTheme } from '../types/theme.js'

export function Layout({
  header,
  statusBar,
  sidePanel,
  showSidePanel = false,
  children,
  theme = defaultTheme,
}: LayoutProps) {
  return (
    <Box flexDirection="column" width="100%" height="100%">
      {header}

      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1}>
          {children}
        </Box>

        {showSidePanel && sidePanel && (
          <Box width={40} borderStyle="single" borderColor={theme.colors.border}>
            {sidePanel}
          </Box>
        )}
      </Box>

      {statusBar}
    </Box>
  )
}

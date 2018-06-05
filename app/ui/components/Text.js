import React from 'react'
import styled from 'styled-components'
import { font } from '../utils/styles/font'

const StyledText = styled.span`
  ${({ size, weight, smallcaps }) => (font({ size, weight, smallcaps }))};
  ${({ color }) => (color ? `color: ${color}` : '')};
`

const Text = props => <StyledText {...props} />

const createTextContainer = Element => {
  const Container = ({
    children,
    color,
    size,
    smallcaps,
    weight,
    ...props
  }) => {
    const textProps = { color, size, smallcaps, weight }
    return (
      <Element {...props}>
        <Text {...textProps}>{children}</Text>
      </Element>
    )
  }
  return Container
}

Text.Block = createTextContainer('div')
Text.Paragraph = createTextContainer('p')

export default Text

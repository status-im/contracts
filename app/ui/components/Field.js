import { node, string } from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import Text from './Text'
import theme from '../theme'
import { unselectable } from '../utils/styles'

const StyledField = styled.div`
  margin-bottom: 20px;
`

const StyledAsterisk = styled.span`
  color: ${theme.accent};
  float: right;
  padding-top: 3px;
  font-size: 12px;
`

const StyledTextBlock = styled(Text.Block)`
  font-weight: 400;
  ${unselectable()};
`

const Field = ({ children, label, wide, ...props }) => {
  const isRequired = React.Children.toArray(children).some(
    ({ props: childProps }) => childProps.required
  )
  return (
    <StyledField {...props}>
      <label style={{ width: wide ? '100%' : 'auto' }}>
        <StyledTextBlock color={theme.textSecondary} smallcaps>
          {label}
          {isRequired && <StyledAsterisk title="Required">*</StyledAsterisk>}
        </StyledTextBlock>
        {children}
      </label>
    </StyledField>
  )
}

Field.propTypes = {
  children: node,
  label: string,
}

export default Field

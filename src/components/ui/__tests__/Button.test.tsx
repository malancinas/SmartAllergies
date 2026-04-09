import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Button>Press Me</Button>);
    expect(getByText('Press Me')).toBeTruthy();
  });

  it('shows spinner when loading', () => {
    const { queryByText, getByTestId } = render(
      <Button loading testID="btn">
        Submit
      </Button>,
    );
    // Text is hidden while loading; spinner is shown instead
    expect(queryByText('Submit')).toBeNull();
    expect(getByTestId('btn')).toBeTruthy();
    expect(getByTestId('btn-spinner')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} testID="btn">
        Click
      </Button>,
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} disabled testID="btn">
        Click
      </Button>,
    );
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<Button variant="primary">Snapshot</Button>);
    expect(toJSON()).toMatchSnapshot();
  });
});

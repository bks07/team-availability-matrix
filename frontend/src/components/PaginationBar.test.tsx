import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PaginationBar from './PaginationBar';

describe('PaginationBar', () => {
  it('renders all navigation buttons and info', () => {
    render(
      <PaginationBar currentPage={2} totalPages={5} totalItems={48} onPageChange={vi.fn()} />
    );

    expect(screen.getByLabelText('First page')).toBeInTheDocument();
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Last page')).toBeInTheDocument();
    expect(screen.getByText(/Page 2 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/48 items/)).toBeInTheDocument();
  });

  it('shows singular item when totalItems is 1', () => {
    render(
      <PaginationBar currentPage={1} totalPages={1} totalItems={1} onPageChange={vi.fn()} />
    );

    expect(screen.getByText(/1 item\)/)).toBeInTheDocument();
  });

  it('disables First and Previous on first page', () => {
    render(
      <PaginationBar currentPage={1} totalPages={3} totalItems={30} onPageChange={vi.fn()} />
    );

    expect(screen.getByLabelText('First page')).toBeDisabled();
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).toBeEnabled();
    expect(screen.getByLabelText('Last page')).toBeEnabled();
  });

  it('disables Next and Last on last page', () => {
    render(
      <PaginationBar currentPage={3} totalPages={3} totalItems={30} onPageChange={vi.fn()} />
    );

    expect(screen.getByLabelText('First page')).toBeEnabled();
    expect(screen.getByLabelText('Previous page')).toBeEnabled();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByLabelText('Last page')).toBeDisabled();
  });

  it('disables all buttons when there is only one page', () => {
    render(
      <PaginationBar currentPage={1} totalPages={1} totalItems={5} onPageChange={vi.fn()} />
    );

    expect(screen.getByLabelText('First page')).toBeDisabled();
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    expect(screen.getByLabelText('Last page')).toBeDisabled();
  });

  it('calls onPageChange with correct page on button clicks', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationBar currentPage={2} totalPages={4} totalItems={40} onPageChange={onPageChange} />
    );

    await user.click(screen.getByLabelText('First page'));
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    await user.click(screen.getByLabelText('Previous page'));
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    await user.click(screen.getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    await user.click(screen.getByLabelText('Last page'));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('renders with Pagination aria-label on nav', () => {
    render(
      <PaginationBar currentPage={1} totalPages={1} totalItems={0} onPageChange={vi.fn()} />
    );

    expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
  });
});

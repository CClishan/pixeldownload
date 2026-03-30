type LinkDropzoneProps = {
  compact: boolean;
  value: string;
  prompt: string;
  hint: string;
  addLabel: string;
  pasteLabel: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onPaste: () => void;
};

export const LinkDropzone = ({
  compact,
  value,
  prompt,
  addLabel,
  pasteLabel,
  onChange,
  onAdd,
  onPaste
}: LinkDropzoneProps) => (
  <section className={`dropzone-surface ${compact ? 'dropzone-surface--compact' : ''}`}>
    <div className="dropzone-grid" aria-hidden="true" />
    <div className={`dropzone-content ${compact ? 'dropzone-content--compact' : ''}`}>
      <div className="dropzone-field">
        {compact ? <p className="dropzone-title">{prompt}</p> : null}
        <div className="dropzone-field-shell">
          <textarea
            className="dropzone-textarea"
            value={value}
            rows={compact ? 3 : 5}
            placeholder="Enter a Threads Link e.g. https://www.threads.net/@thenatureshub/post/CvsLZsqOzt7"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>

      <div className="dropzone-actions">
        <button type="button" className="secondary-button dropzone-button" onClick={onPaste}>
          {pasteLabel}
        </button>
        <button type="button" className="primary-button dropzone-button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
    </div>
  </section>
);

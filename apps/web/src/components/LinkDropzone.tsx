import { LinkIcon } from './icons';

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
  hint,
  addLabel,
  pasteLabel,
  onChange,
  onAdd,
  onPaste
}: LinkDropzoneProps) => (
  <section className={`dropzone ${compact ? 'is-compact' : ''}`}>
    <div className="dropzone__header">
      <div className="dropzone__icon-wrap">
        <LinkIcon className="dropzone__icon" />
      </div>
      <div>
        <h2 className="dropzone__prompt">{prompt}</h2>
        <p className="dropzone__hint">{hint}</p>
      </div>
    </div>

    <textarea
      className="dropzone__textarea"
      value={value}
      rows={compact ? 4 : 7}
      placeholder={`https://www.instagram.com/...
https://www.threads.net/...
https://www.tiktok.com/...`}
      onChange={(event) => onChange(event.target.value)}
    />

    <div className="dropzone__actions">
      <button type="button" className="secondary-button" onClick={onPaste}>
        {pasteLabel}
      </button>
      <button type="button" className="primary-button" onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  </section>
);

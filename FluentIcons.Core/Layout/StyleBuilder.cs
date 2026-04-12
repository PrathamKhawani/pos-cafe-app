using System;

namespace Icons.Core.Layout;

public struct StyleBuilder
{
    private string? _style;

    public StyleBuilder(string? prefix = null)
    {
        _style = prefix;
    }

    public readonly StyleBuilder AddStyle(string? property, string? value) => AddStyle(property, value, true);
    
    public readonly StyleBuilder AddStyle(string? property, string? value, bool condition) => condition ? AddStyle(property, () => value) : this;
    public readonly StyleBuilder AddStyle(string? property, string? value, Func<bool> condition) => condition() ? AddStyle(property, () => value) : this;
    
    public readonly StyleBuilder AddStyle(string? style) => AddStyle(style, true);
    
    public readonly StyleBuilder AddStyle(string? style, bool condition) => condition ? AddStyle(style, () => null) : this;

    private readonly StyleBuilder AddStyle(string? property, Func<string?> value)
    {
        var styleValue = value();
        if (!string.IsNullOrWhiteSpace(styleValue))
        {
            _style = (_style == null) ? $"{property}: {styleValue};" : $"{_style} {property}: {styleValue};";
        }
        return this;
    }

    private readonly StyleBuilder AddStyle(string? style, Func<string?> value)
    {
        if (!string.IsNullOrWhiteSpace(style))
        {
            _style = (_style == null) ? style : $"{_style} {style}";
        }
        return this;
    }

    public override readonly string? ToString() => _style?.Trim();

    public readonly string? Build() => ToString();
}

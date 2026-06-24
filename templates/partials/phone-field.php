<?php
/**
 * Campo de telefone com prefixo internacional.
 * Países: expandir $ag_phone_countries para adicionar novos.
 */
$ag_phone_countries = [
    'BR' => ['dial' => '+55', 'label' => 'Brasil', 'flag' => '🇧🇷'],
];
$ag_phone_placeholder = $ag_phone_placeholder ?? '(16) 999999-999';
?>
<label class="ag-field ag-field--phone">
    <span>Telefone</span>
    <div class="ag-phone-field" data-ag-phone-field>
        <select name="phoneCountry" class="ag-phone-field__country" data-ag-phone-country aria-label="País do telefone">
            <?php foreach ($ag_phone_countries as $code => $country) : ?>
                <option value="<?php echo esc_attr($code); ?>" data-dial="<?php echo esc_attr($country['dial']); ?>">
                    <?php echo esc_html($country['flag'] . ' ' . $country['dial']); ?>
                </option>
            <?php endforeach; ?>
        </select>
        <input
            type="tel"
            name="phoneNumber"
            class="ag-phone-field__number"
            inputmode="numeric"
            autocomplete="tel-national"
            placeholder="<?php echo esc_attr($ag_phone_placeholder); ?>"
            maxlength="20"
        >
    </div>
</label>
